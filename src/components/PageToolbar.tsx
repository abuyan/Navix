'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Upload, Link, Trash2, Sparkles, Loader2, ChevronDown, FolderPlus, Compass, ArrowUpAz, ArrowDownZa, ArrowDownWideNarrow, ArrowUpNarrowWide, Dices } from 'lucide-react';
import { useToast } from './Toast';

export type SortBy = 'name' | 'visits';
export type SortOrder = 'asc' | 'desc';

interface PageToolbarProps {
    onAddCategory: () => void;
    onAddSite: () => void;
    onImport: () => void;
    onClearEmpty: () => void;
    onBatchAI: () => void;
    onAIDiscover?: () => void;
    onAICategorize?: () => void;
    onAIIcon?: () => void;
    isBatchAnalyzing: boolean;
    batchProgress?: string;
    sortBy: SortBy;
    sortOrder: SortOrder;
    onSortChange: (sortBy: SortBy, sortOrder: SortOrder) => void;
    user?: any;
    aiConfigured?: boolean;
    panelName?: string;
    isPublic?: boolean;
    panelSlug?: string;
    panelId?: string;
}

export default function PageToolbar({ onAddCategory, onAddSite, onImport, onClearEmpty, onBatchAI, onAIDiscover, onAICategorize, onAIIcon, isBatchAnalyzing, batchProgress, sortBy, sortOrder, onSortChange, user, aiConfigured = true, panelName, isPublic, panelSlug, panelId }: PageToolbarProps) {
    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const [aiMenuOpen, setAiMenuOpen] = useState(false);
    const addMenuRef = useRef<HTMLDivElement>(null);
    const aiMenuRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    // 点击外部关闭菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
                setAddMenuOpen(false);
            }
            if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) {
                setAiMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCopyLink = () => {
        const url = panelSlug === 'home' ? '/' : `/p/${panelSlug || panelId}`;
        const fullUrl = `${window.location.origin}${url}`;
        navigator.clipboard.writeText(fullUrl).then(() => {
            showToast('链接已复制到剪贴板', 'success');
        }).catch(err => {
            console.error('Failed to copy link:', err);
        });
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            {/* 左侧：名称和标签 */}
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                    {panelName}
                </h1>
                {isPublic && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] text-[11px] font-bold whitespace-nowrap">
                            已共享
                        </span>
                        <button
                            onClick={handleCopyLink}
                            className="p-1 px-1.5 rounded-md hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1 text-[11px] font-medium border border-transparent hover:border-[var(--color-border)] whitespace-nowrap"
                            title="复制共享链接"
                        >
                            <Link size={12} />
                            <span>复制链接</span>
                        </button>
                    </div>
                )}
            </div>

            {/* 右侧：操作区域 */}
            <div className="flex items-center gap-2 flex-wrap sm:gap-3">
                {user && (
                    <div className="flex items-center gap-2">
                        {/* 添加下拉菜单 */}
                        <div className="relative" ref={addMenuRef}>
                            {/* ... (按钮代码保持不变) */}
                            <button
                                onClick={() => setAddMenuOpen(!addMenuOpen)}
                                className="btn-new-category group flex items-center gap-2 px-4 h-9 rounded-lg font-medium transition-all text-sm border hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Plus size={16} />
                                <span>添加</span>
                            </button>

                            {addMenuOpen && (
                                <div
                                    className="absolute left-0 top-full mt-2 w-44 py-2 rounded-xl z-50"
                                    style={{
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        border: '1px solid var(--color-border)',
                                        boxShadow: 'var(--shadow-lg)'
                                    }}
                                >
                                    <button
                                        onClick={() => {
                                            onAddCategory();
                                            setAddMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-3"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        <FolderPlus size={16} className="text-[var(--color-text-tertiary)]" />
                                        添加分类
                                    </button>
                                    <button
                                        onClick={() => {
                                            onAddSite();
                                            setAddMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-3"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        <Link size={16} className="text-[var(--color-text-tertiary)]" />
                                        添加网页
                                    </button>
                                    <button
                                        onClick={() => {
                                            onImport();
                                            setAddMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-3"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        <Upload size={16} className="text-[var(--color-text-tertiary)]" />
                                        导入书签
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* AI+ 下拉菜单 */}
                        <div className="relative" ref={aiMenuRef}>
                            <button
                                onClick={() => setAiMenuOpen(!aiMenuOpen)}
                                className={`relative flex items-center gap-2 px-4 h-9 rounded-lg font-medium transition-all text-sm border hover:scale-[1.02] active:scale-[0.98]`}
                                style={{
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-primary)'
                                }}
                            >
                                <Sparkles size={16} className="text-[var(--color-accent)]" />
                                <span>AI+</span>
                            </button>

                            {aiMenuOpen && (
                                <div
                                    className="absolute left-0 top-full mt-2 w-40 py-2 rounded-xl z-50"
                                    style={{
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        border: '1px solid var(--color-border)',
                                        boxShadow: 'var(--shadow-lg)'
                                    }}
                                >
                                    <button
                                        onClick={() => {
                                            if (onAIDiscover) {
                                                onAIDiscover();
                                            }
                                            setAiMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-3"
                                        style={{ color: 'var(--color-text-primary)' }}
                                        title="描述你想找的网页，AI 帮你全网搜寻"
                                    >
                                        <Compass size={16} className="text-[var(--color-text-tertiary)]" />
                                        查找推荐
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (aiConfigured) {
                                                onBatchAI();
                                            }
                                            setAiMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-3"
                                        style={{ color: aiConfigured ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
                                        title={aiConfigured ? "AI 批量整理所有书签" : "尚未配置 AI 模型，请前往系统设置配置"}
                                    >
                                        <Sparkles size={16} className="text-[var(--color-text-tertiary)]" />
                                        书签优化
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (aiConfigured) {
                                                if (onAICategorize) onAICategorize();
                                            }
                                            setAiMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-3"
                                        style={{ color: aiConfigured ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
                                        title={aiConfigured ? "AI 自动分类所有书签" : "尚未配置 AI 模型"}
                                    >
                                        <FolderPlus size={16} className="text-[var(--color-text-tertiary)]" />
                                        智能分类
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (aiConfigured) {
                                                if (onAIIcon) onAIIcon();
                                            }
                                            setAiMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-3"
                                        style={{ color: aiConfigured ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
                                        title={aiConfigured ? "AI 自动匹配分类图标" : "尚未配置 AI 模型"}
                                    >
                                        <Dices size={16} className="text-[var(--color-text-tertiary)]" />
                                        随机图标
                                    </button>
                                    <button
                                        onClick={() => {
                                            onClearEmpty();
                                            setAiMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-3 hover:text-red-500"
                                        style={{ color: 'var(--color-text-primary)' }}
                                        title="清除所有空分类"
                                    >
                                        <Trash2 size={16} className="text-[var(--color-text-tertiary)]" />
                                        清理空分类
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 分段排序控制 */}
                <div
                    className="flex items-center p-1 rounded-lg border ml-1"
                    style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        borderColor: 'var(--color-border)'
                    }}
                >
                    <div className="flex items-center gap-1">
                        {/* 名称排序 */}
                        <button
                            onClick={() => {
                                if (sortBy === 'name') {
                                    onSortChange('name', sortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                    onSortChange('name', 'asc');
                                }
                            }}
                            className="flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-medium transition-all"
                            style={{
                                backgroundColor: sortBy === 'name' ? 'var(--color-bg-secondary)' : 'transparent',
                                color: sortBy === 'name' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                                border: sortBy === 'name' ? '1px solid var(--color-border)' : '1px solid transparent',
                                boxShadow: sortBy === 'name' ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            <span>名称</span>
                            {sortBy === 'name' && (
                                <span className="opacity-50 ml-0.5">
                                    {sortOrder === 'asc' ? <ArrowUpAz size={14} /> : <ArrowDownZa size={14} />}
                                </span>
                            )}
                        </button>

                        {/* 点击量排序 */}
                        <button
                            onClick={() => {
                                if (sortBy === 'visits') {
                                    onSortChange('visits', sortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                    onSortChange('visits', 'desc');
                                }
                            }}
                            className="flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-medium transition-all"
                            style={{
                                backgroundColor: sortBy === 'visits' ? 'var(--color-bg-secondary)' : 'transparent',
                                color: sortBy === 'visits' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                                border: sortBy === 'visits' ? '1px solid var(--color-border)' : '1px solid transparent',
                                boxShadow: sortBy === 'visits' ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            <span>点击量</span>
                            {sortBy === 'visits' && (
                                <span className="opacity-50 ml-0.5">
                                    {sortOrder === 'desc' ? <ArrowDownWideNarrow size={14} /> : <ArrowUpNarrowWide size={14} />}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
