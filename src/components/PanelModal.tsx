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
    };
}

export default function PanelModal({ isOpen, onClose, onSuccess, panel }: PanelModalProps) {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (panel) {
            setName(panel.name);
            setSlug(panel.slug || '');
        } else {
            setName('');
            setSlug('');
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
                body: JSON.stringify({ name, slug: slug.trim() || undefined }),
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
                        {panel ? '编辑版块' : '新增导航版块'}
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
                            版块名称 <span className="text-red-500">*</span>
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

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                            路径标识 (Slug)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] text-sm">
                                /p/
                            </span>
                            <input
                                type="text"
                                value={slug}
                                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                placeholder="work-tools"
                                className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl outline-none focus:border-[var(--color-text-tertiary)] transition-all text-sm"
                            />
                        </div>
                        <p className="mt-1.5 text-xs text-[var(--color-text-tertiary)]">
                            用于浏览器地址栏，选填。留空将使用默认 ID。
                        </p>
                    </div>

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
