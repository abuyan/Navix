'use client';

import { Plus, Upload, BarChart2, Type, Link, Trash2, Sparkles, Loader2 } from 'lucide-react';

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
    user?: any; // Add user prop
}

export default function PageToolbar({ onAddCategory, onAddSite, onImport, onClearEmpty, onBatchAI, isBatchAnalyzing, batchProgress, sortBy, sortOrder, onSortChange, user }: PageToolbarProps) {
    return (
        <div className="flex items-center justify-between mb-8">
            {/* 左侧：操作按钮 - Only show if user is authenticated */}
            <div className="flex items-center gap-3">
                {user && (
                    <>
                        <button
                            onClick={onAddCategory}
                            className="btn-new-category group flex items-center gap-2 px-4 h-9 rounded-lg font-medium transition-all text-sm border hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus size={16} />
                            <span>新建分类</span>
                        </button>

                        <button
                            onClick={onAddSite}
                            className="flex items-center gap-2 px-4 h-9 rounded-lg font-medium transition-all text-sm border hover:scale-[1.02] active:scale-[0.98] hover:bg-[var(--color-bg-tertiary)]"
                            style={{
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-secondary)',
                                backgroundColor: 'transparent'
                            }}
                        >
                            <Link size={16} />
                            <span>添加站点</span>
                        </button>

                        <button
                            onClick={onImport}
                            className="flex items-center gap-2 px-4 h-9 rounded-lg font-medium transition-all text-sm border hover:scale-[1.02] active:scale-[0.98] hover:bg-[var(--color-bg-tertiary)]"
                            style={{
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-secondary)',
                                backgroundColor: 'transparent'
                            }}
                        >
                            <Upload size={16} />
                            <span>导入书签</span>
                        </button>

                        <button
                            onClick={onBatchAI}
                            disabled={isBatchAnalyzing}
                            className={`flex items-center gap-2 px-4 h-9 rounded-lg font-medium transition-all text-sm border hover:scale-[1.02] active:scale-[0.98] hover:bg-[var(--color-bg-tertiary)] ${isBatchAnalyzing ? 'btn-ai-active opacity-100 cursor-not-allowed' : ''}`}
                            style={{
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-secondary)',
                                backgroundColor: 'transparent',
                                minWidth: '130px', // Ensure button doesn't jump too much in width
                                justifyContent: 'center'
                            }}
                            title="批量 AI 分析"
                        >
                            {isBatchAnalyzing ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Sparkles size={16} />
                            )}
                            <span>{isBatchAnalyzing ? (batchProgress || '整理中...') : 'AI 整理'}</span>
                        </button>

                        <button
                            onClick={onClearEmpty}
                            className="flex items-center gap-2 px-4 h-9 rounded-lg font-medium transition-all text-sm border hover:scale-[1.02] active:scale-[0.98] hover:bg-[var(--color-bg-tertiary)] hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/30"
                            style={{
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-secondary)',
                                backgroundColor: 'transparent'
                            }}
                            title="清除所有空分类"
                        >
                            <Trash2 size={16} />
                            <span>清理空分类</span>
                        </button>
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
