'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Site } from '@prisma/client';
import { X, Upload, Image as ImageIcon, Trash2, Sparkles, Loader2, Check, ChevronDown } from 'lucide-react';

interface SiteEditModalProps {
    site?: Site | null;
    categories?: { id: string, name: string }[];
    defaultCategoryId?: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string | null, data: Partial<Site>) => void;
}

export function SiteEditModal({ site, categories = [], defaultCategoryId, isOpen, onClose, onSave }: SiteEditModalProps) {
    const [title, setTitle] = useState(site?.title || '');
    const [url, setUrl] = useState(site?.url || '');
    const [description, setDescription] = useState(site?.description || '');
    const [icon, setIcon] = useState(site?.icon || '');
    const [categoryId, setCategoryId] = useState(site?.categoryId || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        // 点击外部关闭下拉框
        const handleClickOutside = (e: MouseEvent) => {
            if (isCategoryDropdownOpen && !(e.target as HTMLElement).closest('.category-select-container')) {
                setIsCategoryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isCategoryDropdownOpen]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTitle(site?.title || '');
            setUrl(site?.url || '');
            setDescription(site?.description || '');
            setIcon(site?.icon || '');
            setCategoryId(site?.categoryId || defaultCategoryId || categories[0]?.id || '');

            // 键盘 ESC 关闭
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleKeyDown);

            // 锁定背景滚动
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';

            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
            };
        }
    }, [isOpen, site, onClose]);

    // AI 智能提取
    const handleAIExtract = async () => {
        if (!url.trim()) {
            alert('请先输入网址');
            return;
        }

        setIsExtracting(true);
        try {
            const response = await fetch('/api/ai/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '提取失败');
            }

            // 自动填充表单
            if (data.url) setUrl(data.url);
            if (data.title) setTitle(data.title);
            if (data.description) setDescription(data.description);
            // tags 暂时不处理，后续可以显示在 UI 上

        } catch (error) {
            console.error('AI 提取失败:', error);
            alert(`智能提取失败: ${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 限制大小 200KB
        if (file.size > 200 * 1024) {
            alert('图片大小不能超过 200KB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setIcon(base64);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!title.trim() || !url.trim()) {
            alert('标题和网址不能为空');
            return;
        }

        setIsSaving(true);
        try {
            await onSave(site?.id || null, {
                title: title.trim(),
                url: url.trim(),
                description: description.trim() || null,
                icon: icon.trim() || null,
                categoryId
            });
            onClose();
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败，请重试');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
            <div
                className="w-full max-w-lg rounded-xl shadow-2xl animate-in zoom-in duration-200"
                style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 border-b"
                    style={{
                        height: '60px',
                        borderColor: 'var(--color-border)'
                    }}
                >
                    <h2
                        className="text-lg font-bold"
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        {site ? '编辑站点' : '添加站点'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                    >
                        <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* 网址 + AI 按钮 */}
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            网址 *
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="flex-1 px-3 h-9 rounded-lg border outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
                                style={{
                                    backgroundColor: 'var(--color-bg-tertiary)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-primary)'
                                }}
                                placeholder="https://example.com"
                            />
                            <button
                                type="button"
                                onClick={handleAIExtract}
                                disabled={isExtracting || !url.trim()}
                                className="group flex items-center gap-2 px-4 h-9 rounded-lg font-medium transition-all border disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    backgroundColor: 'var(--color-action-bg)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-primary)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-action-hover)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-action-bg)'}
                                title="AI 智能填充标题和描述"
                            >
                                {isExtracting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Sparkles size={16} />
                                )}
                                <span className="text-sm">{isExtracting ? '分析中' : 'AI 填充'}</span>
                            </button>
                        </div>
                    </div>

                    {/* 站点名称 + 所属分类并排 */}
                    <div className="flex gap-4">
                        {/* 站点名称 */}
                        <div className="flex-[2]">
                            <label
                                className="block text-sm font-medium mb-2"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                站点名称 *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 h-9 rounded-lg border outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
                                style={{
                                    backgroundColor: 'var(--color-bg-tertiary)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-primary)'
                                }}
                                placeholder="请输入站点名称"
                            />
                        </div>

                        {/* 所属分类 */}
                        {categories.length > 0 && (
                            <div className="flex-1 category-select-container relative">
                                <label
                                    className="block text-sm font-medium mb-2"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                >
                                    所属分类
                                </label>
                                <div
                                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                    className="w-full px-3 h-9 rounded-lg border cursor-pointer flex items-center justify-between transition-colors"
                                    style={{
                                        backgroundColor: 'var(--color-bg-tertiary)',
                                        borderColor: 'var(--color-border)',
                                        color: 'var(--color-text-primary)'
                                    }}
                                >
                                    <span className="text-sm truncate mr-2">
                                        {categories.find(c => c.id === categoryId)?.name || '选择分类'}
                                    </span>
                                    <ChevronDown
                                        size={14}
                                        className={`transition-transform duration-200 shrink-0 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}
                                        style={{ color: 'var(--color-text-tertiary)' }}
                                    />
                                </div>

                                {isCategoryDropdownOpen && (
                                    <div
                                        className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg shadow-xl border overflow-hidden animate-in fade-in zoom-in duration-150"
                                        style={{
                                            backgroundColor: 'var(--color-bg-secondary)',
                                            borderColor: 'var(--color-border)',
                                            maxHeight: '200px',
                                            overflowY: 'auto'
                                        }}
                                    >
                                        {categories.map(cat => (
                                            <div
                                                key={cat.id}
                                                onClick={() => {
                                                    setCategoryId(cat.id);
                                                    setIsCategoryDropdownOpen(false);
                                                }}
                                                className="px-4 py-2 text-sm cursor-pointer transition-colors"
                                                style={{
                                                    backgroundColor: categoryId === cat.id ? 'var(--color-accent-soft)' : 'transparent',
                                                    color: categoryId === cat.id ? 'var(--color-accent)' : 'var(--color-text-primary)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (categoryId !== cat.id) e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (categoryId !== cat.id) e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                {cat.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 说明 */}
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            站点说明
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border outline-none focus:border-[var(--color-accent)] transition-colors resize-none text-sm"
                            style={{
                                backgroundColor: 'var(--color-bg-tertiary)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-primary)'
                            }}
                            placeholder="简短描述这个站点..."
                        />
                    </div>

                    {/* 图标 URL / 上传 (并排精简布局) */}
                    <div className="space-y-2">
                        <label
                            className="block text-sm font-medium"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            图标预览与上传
                        </label>
                        <div className="flex items-center gap-3">
                            {/* URL 输入框 */}
                            <div className="flex-1 relative">
                                <input
                                    type="url"
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    className="w-full px-3 h-9 pr-9 rounded-lg border outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
                                    style={{
                                        backgroundColor: 'var(--color-bg-tertiary)',
                                        borderColor: 'var(--color-border)',
                                        color: 'var(--color-text-primary)'
                                    }}
                                    placeholder="图标 URL..."
                                />
                                {icon && (
                                    <button
                                        onClick={() => setIcon('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 transition-colors"
                                        style={{ color: 'var(--color-text-tertiary)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>

                            {/* 预览方块 */}
                            <div
                                className="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 p-1.5 transition-all"
                                style={{
                                    backgroundColor: 'var(--color-bg-tertiary)',
                                    borderColor: 'var(--color-border)'
                                }}
                            >
                                {icon ? (
                                    <img
                                        src={icon}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${url || 'example.com'}&sz=64`;
                                        }}
                                    />
                                ) : (
                                    <ImageIcon size={18} style={{ color: 'var(--color-text-tertiary)' }} />
                                )}
                            </div>

                            {/* 上传按钮 */}
                            <input
                                type="file"
                                id="icon-upload"
                                className="hidden"
                                accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon"
                                onChange={handleFileUpload}
                            />
                            <label
                                htmlFor="icon-upload"
                                className="flex items-center justify-center gap-2 px-3 h-9 rounded-lg border cursor-pointer transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    backgroundColor: 'var(--color-action-bg)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-primary)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-action-hover)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-action-bg)'}
                                title="从本地上传图标"
                            >
                                <Upload size={16} />
                                <span className="text-sm font-medium">上传</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="flex items-center justify-end gap-3 px-6 py-4 border-t"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    <button
                        onClick={onClose}
                        className="px-6 h-9 rounded-lg font-medium transition-all hover:bg-[var(--color-action-hover)] active:scale-95"
                        style={{
                            backgroundColor: 'var(--color-action-bg)',
                            color: 'var(--color-text-secondary)'
                        }}
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="group flex items-center gap-2 px-6 h-9 rounded-lg font-medium transition-all border disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                            backgroundColor: 'var(--color-text-primary)',
                            borderColor: 'var(--color-text-primary)',
                            color: 'var(--color-bg-primary)'
                        }}
                    >
                        {isSaving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Check size={16} />
                        )}
                        <span className="text-sm">{isSaving ? '保存中' : '保存'}</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default SiteEditModal;
