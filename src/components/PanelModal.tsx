'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { createPortal } from 'react-dom';

interface PanelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    panel?: {
        id: string;
        name: string;
        slug: string | null;
        isPublic?: boolean;
    };
}

export default function PanelModal({ isOpen, onClose, onSuccess, panel }: PanelModalProps) {
    const [name, setName] = useState('');
    const [isPublic, setIsPublic] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (panel) {
            setName(panel.name);
            setIsPublic(panel.isPublic || false);
        } else {
            setName('');
            setIsPublic(false);
        }
        setError(null);
    }, [panel, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const url = panel ? `/api/panels/${panel.id}` : '/api/panels';
            const method = panel ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, isPublic }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '保存失败');
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : '保存失败');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-md bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--color-border)] transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--color-border)]">
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                        {panel ? '编辑收藏夹' : '新增收藏夹'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                            收藏夹名称
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="如：工作专区、常用工具"
                            className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl outline-none focus:border-[var(--color-border-hover)] transition-all text-sm"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl">
                        <div>
                            <div className="text-sm font-medium text-[var(--color-text-primary)]">公开共享</div>
                            <div className="text-xs text-[var(--color-text-tertiary)]">允许未登录访客查看此版块</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPublic(!isPublic)}
                            className={`w-10 h-6 rounded-full transition-colors relative ${isPublic ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-bg-tertiary)]'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {/* Slug input removed as per user request (system auto-generated) */}

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center gap-3 justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 h-9 rounded-lg font-medium transition-all hover:bg-[var(--color-action-hover)] active:scale-95 text-sm"
                            style={{
                                backgroundColor: 'var(--color-action-bg)',
                                color: 'var(--color-text-secondary)'
                            }}
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="group flex items-center gap-2 px-6 h-9 rounded-lg font-medium transition-all border disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                                backgroundColor: 'var(--color-text-primary)',
                                borderColor: 'var(--color-text-primary)',
                                color: 'var(--color-bg-primary)'
                            }}
                        >
                            {isLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Check size={16} />
                            )}
                            <span className="text-sm">{isLoading ? '保存中...' : '确定保存'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
