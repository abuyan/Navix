'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface AIModelConfig {
    id: string;
    name: string;
    model: string;
    baseUrl: string;
    apiKey: string;
    isActive: boolean;
}

interface AIModelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (model: AIModelConfig) => void;
    model?: AIModelConfig | null;
}

export default function AIModelModal({ isOpen, onClose, onSave, model }: AIModelModalProps) {
    const [formData, setFormData] = useState<AIModelConfig>({
        id: '',
        name: '',
        model: '',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        apiKey: '',
        isActive: false
    });

    useEffect(() => {
        if (isOpen) {
            if (model) {
                setFormData(model);
            } else {
                // New model defaults
                setFormData({
                    id: crypto.randomUUID(),
                    name: '',
                    model: 'glm-4-flash',
                    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
                    apiKey: '',
                    isActive: false
                });
            }
        }
    }, [isOpen, model]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.model || !formData.apiKey) return;
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl border border-[var(--color-border)] overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--color-border)]">
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                        {model ? '编辑模型配置' : '添加 AI 模型'}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                            配置名称
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="例如：智谱 GLM-4"
                            className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl outline-none focus:border-[var(--color-accent)] transition-all text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                            模型 ID (Model)
                        </label>
                        <input
                            type="text"
                            value={formData.model}
                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                            placeholder="例如：glm-4-flash"
                            className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl outline-none focus:border-[var(--color-accent)] transition-all text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                            API 基础地址 (Base URL)
                        </label>
                        <input
                            type="text"
                            value={formData.baseUrl}
                            onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
                            placeholder="https://open.bigmodel.cn/api/paas/v4"
                            className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl outline-none focus:border-[var(--color-accent)] transition-all text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                            API Key
                        </label>
                        <input
                            type="password"
                            value={formData.apiKey}
                            onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                            placeholder="sk-..."
                            className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl outline-none focus:border-[var(--color-accent)] transition-all text-sm"
                            required
                        />
                    </div>

                    <div className="flex items-center gap-3 justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 h-9 rounded-lg font-medium transition-all hover:bg-[var(--color-action-bg)] text-[var(--color-text-secondary)] text-sm"
                            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 h-9 rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                                backgroundColor: 'var(--color-text-primary)',
                                color: 'var(--color-bg-primary)'
                            }}
                        >
                            <Check size={16} />
                            确认保存
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
