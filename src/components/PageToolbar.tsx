'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Upload, BarChart2, Type, Link, Trash2, Sparkles, Loader2, ChevronDown, FolderPlus, Compass } from 'lucide-react';

export type SortBy = 'name' | 'visits';
export type SortOrder = 'asc' | 'desc';

interface PageToolbarProps {
    onAddCategory: () => void;
    onAddSite: () => void;
    onImport: () => void;
    onClearEmpty: () => void;
    onBatchAI: () => void;
    isBatchAnalyzing: boolean;
    batchProgress?: string;
    sortBy: SortBy;
    sortOrder: SortOrder;
    onSortChange: (sortBy: SortBy, sortOrder: SortOrder) => void;
    user?: any;
    aiConfigured?: boolean;
}

export default function PageToolbar({ onAddCategory, onAddSite, onImport, onClearEmpty, onBatchAI, isBatchAnalyzing, batchProgress, sortBy, sortOrder, onSortChange, user, aiConfigured = true }: PageToolbarProps) {
    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const [aiMenuOpen, setAiMenuOpen] = useState(false);
    const addMenuRef = useRef<HTMLDivElement>(null);
    const aiMenuRef = useRef<HTMLDivElement>(null);

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

    return (
        <div className="flex items-center justify-between mb-8">
            {/* 左侧：操作按钮 - Only show if user is authenticated */}
            <div className="flex items-center gap-3">
                {user && (
                    <>
                        {/* 添加下拉菜单 */}
                        <div className="relative" ref={addMenuRef}>
                            <button
                                onClick={() => setAddMenuOpen(!addMenuOpen)}
                                className="btn-new-category group flex items-center gap-2 px-4 h-9 rounded-lg font-medium transition-all text-sm border hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Plus size={16} />
                                <span>添加</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${addMenuOpen ? 'rotate-180' : ''}`} />
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
                                    <div
                                        className="my-2 mx-3 h-px"
                                        style={{ backgroundColor: 'var(--color-border)' }}
                                    />
                                    <button
                                        onClick={() => {
                                            // TODO: AI 发现功能
                                            setAddMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-3"
                                        style={{ color: 'var(--color-text-tertiary)' }}
                                        title="输入一段话，AI 帮你发现相关站点（即将推出）"
                                    >
                                        <Compass size={16} />
                                        AI 发现
                                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)]">即将推出</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* AI+ 下拉菜单 */}
                        <div className="relative" ref={aiMenuRef}>
                            <button
                                onClick={() => !isBatchAnalyzing && setAiMenuOpen(!aiMenuOpen)}
                                disabled={isBatchAnalyzing}
                                className={`relative flex items-center gap-2 px-4 h-9 rounded-lg font-medium transition-all text-sm border hover:scale-[1.02] active:scale-[0.98] ${isBatchAnalyzing ? 'cursor-not-allowed opacity-80' : ''}`}
                                style={{
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-primary)'
                                }}
                            >
                                {isBatchAnalyzing ? (
                                    <Loader2 size={16} className="animate-spin text-[var(--color-accent)]" />
                                ) : (
                                    <Sparkles size={16} className="text-[var(--color-accent)]" />
                                )}
                                <span>{isBatchAnalyzing ? (batchProgress || '整理中...') : 'AI+'}</span>
                                {!isBatchAnalyzing && (
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${aiMenuOpen ? 'rotate-180' : ''}`} />
                                )}
                            </button>

                            {aiMenuOpen && !isBatchAnalyzing && (
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
                                            if (aiConfigured) {
                                                onBatchAI();
                                            }
                                            setAiMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-3"
                                        style={{ color: aiConfigured ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
                                        title={aiConfigured ? "AI 批量整理所有书签" : "尚未配置 AI 模型，请前往系统设置配置"}
                                    >
                                        <Sparkles size={16} className="text-[var(--color-accent)]" />
                                        AI 整理
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
                    </>
                )}
            </div>

            {/* 右侧：分段排序控制 */}
            <div
                className="flex items-center p-1 rounded-lg border"
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
                        className="flex items-center gap-2 px-3 h-7 rounded-md text-xs font-medium transition-all"
                        style={{
                            backgroundColor: sortBy === 'name' ? 'var(--color-bg-secondary)' : 'transparent',
                            color: sortBy === 'name' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                            border: sortBy === 'name' ? '1px solid var(--color-border)' : '1px solid transparent',
                            boxShadow: sortBy === 'name' ? 'var(--shadow-sm)' : 'none'
                        }}
                    >
                        <Type size={14} className={sortBy === 'name' ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'} />
                        <span>名称</span>
                        {sortBy === 'name' && (
                            <span className="opacity-60">
                                {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
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
                        className="flex items-center gap-2 px-3 h-7 rounded-md text-xs font-medium transition-all"
                        style={{
                            backgroundColor: sortBy === 'visits' ? 'var(--color-bg-secondary)' : 'transparent',
                            color: sortBy === 'visits' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                            border: sortBy === 'visits' ? '1px solid var(--color-border)' : '1px solid transparent',
                            boxShadow: sortBy === 'visits' ? 'var(--shadow-sm)' : 'none'
                        }}
                    >
                        <BarChart2 size={14} className={sortBy === 'visits' ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'} />
                        <span>点击量</span>
                        {sortBy === 'visits' && (
                            <span className="opacity-60">
                                {sortOrder === 'desc' ? '高到低' : '低到高'}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
