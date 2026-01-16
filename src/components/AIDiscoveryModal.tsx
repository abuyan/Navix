'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Loader2, Check, Globe, Plus, Search, RefreshCw, ChevronDown, ExternalLink } from 'lucide-react';
import { useToast } from './Toast';

interface RecommendedSite {
    title: string;
    url: string;
    description: string;
}

interface AIDiscoveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: { id: string, name: string }[];
    onAddSites: (sites: RecommendedSite[], categoryId: string | 'new') => Promise<void>;
}

export function AIDiscoveryModal({ isOpen, onClose, categories, onAddSites }: AIDiscoveryModalProps) {
    const { showToast } = useToast();
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<RecommendedSite[]>([]);
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [allShownUrls, setAllShownUrls] = useState<string[]>([]);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        const handleClickOutside = (e: MouseEvent) => {
            if (isCategoryOpen && !(e.target as HTMLElement).closest('.category-select-container')) {
                setIsCategoryOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, isCategoryOpen]);

    const handleSearch = async (isRetry = false) => {
        if (!query.trim()) return;
        setIsSearching(true);

        // 如果不是“再来一次”，则重构已显示列表；否则保留并追加
        const currentExcludes = isRetry ? allShownUrls : [];
        if (!isRetry) {
            setResults([]);
            setSelectedUrls(new Set());
            setAllShownUrls([]);
        }

        try {
            const response = await fetch('/api/ai/discover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query.trim(),
                    excludeUrls: currentExcludes
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || '搜索失败');
            }

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                // Keep the last line in buffer if it's potentially incomplete
                // Unless we are done, but here we process as much as possible
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const result = JSON.parse(line.trim());
                            if (result.title && result.url) {
                                setResults(prev => {
                                    // Avoid duplicates
                                    if (prev.some(p => p.url === result.url)) return prev;
                                    const newResults = [...prev, result];
                                    return newResults;
                                });
                                // Auto-select new results
                                setSelectedUrls(prev => {
                                    const next = new Set(prev);
                                    next.add(result.url);
                                    return next;
                                });
                                setAllShownUrls(prev => [...prev, result.url]);
                            }
                        } catch (e) {
                            console.warn('Failed to parse line:', line);
                        }
                    }
                }
            }

            // Process any remaining buffer
            if (buffer.trim()) {
                try {
                    const result = JSON.parse(buffer.trim());
                    if (result.title && result.url) {
                        setResults(prev => {
                            if (prev.some(p => p.url === result.url)) return prev;
                            return [...prev, result];
                        });
                        setSelectedUrls(prev => {
                            const next = new Set(prev);
                            next.add(result.url);
                            return next;
                        });
                        setAllShownUrls(prev => [...prev, result.url]);
                    }
                } catch (e) {
                    // ignore incomplete json at very end
                }
            }

        } catch (error) {
            console.error('Discovery error:', error);
            showToast(error instanceof Error ? error.message : '发现失败', 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const toggleSelection = (url: string) => {
        const next = new Set(selectedUrls);
        if (next.has(url)) next.delete(url);
        else next.add(url);
        setSelectedUrls(next);
    };

    const handleSave = async (categoryId: string) => {
        const sitesToSave = results.filter(s => selectedUrls.has(s.url));
        if (sitesToSave.length === 0) {
            showToast('请至少选择一个网页', 'info');
            return;
        }

        setIsSaving(true);
        try {
            await onAddSites(sitesToSave, categoryId);
            showToast(`成功添加 ${sitesToSave.length} 个网页`, 'success');
            onClose();
            // 重置状态
            setQuery('');
            setResults([]);
        } catch (error) {
            showToast('保存失败', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] relative overflow-visible transition-all"
                style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5), 0 18px 36px -18px rgba(0,0,0,0.5)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Search Header Area - The core of Spotlight Experience */}
                <div className={`relative flex items-center h-16 px-6 z-20 ${isSearching && results.length === 0 ? 'btn-ai-active' : ''}`}>
                    <Search className="opacity-30 mr-4" size={20} />
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleSearch();
                            if (e.key === 'Escape') onClose();
                        }}
                        placeholder="你想找什么样的网站？ AI 帮你全网搜寻"
                        className="flex-1 bg-transparent border-none outline-none text-base placeholder:opacity-30 font-medium"
                        style={{ color: 'var(--color-text-primary)' }}
                        autoFocus
                    />

                    <div className="flex items-center gap-3">
                        {isSearching && (
                            <div className="flex items-center gap-2 text-sm animate-pulse" style={{ color: 'var(--color-text-secondary)' }}>
                                <span>AI 查找中</span>
                                <span className="inline-flex gap-0.5">
                                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                                </span>
                            </div>
                        )}
                        {query && !isSearching && (
                            <button
                                onClick={() => handleSearch()}
                                className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[11px] font-bold opacity-80 hover:opacity-100 transition-all active:scale-95"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                Enter 发现
                            </button>
                        )}
                    </div>
                </div>

                {/* Content / Results */}
                {results.length > 0 && (
                    <div className="flex flex-col border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="p-6 pt-6 overflow-y-auto max-h-[60vh]">
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center justify-between text-[13px] font-bold uppercase tracking-widest opacity-40 px-1">
                                    <div className="flex items-center gap-2">
                                        <span>发现结果 ({results.length})</span>
                                        {isSearching && <Loader2 size={12} className="animate-spin text-[var(--color-accent)]" />}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => {
                                                results.forEach((s, i) => {
                                                    setTimeout(() => {
                                                        window.open(s.url, '_blank');
                                                    }, i * 200);
                                                });
                                                showToast('正在尝试打开所有网页...', 'info');
                                            }}
                                            className="flex items-center gap-2 hover:text-[var(--color-text-primary)] transition-all active:scale-95 py-1"
                                        >
                                            <ExternalLink size={14} />
                                            <span>一键预览</span>
                                        </button>
                                        <button
                                            onClick={() => handleSearch(true)}
                                            disabled={isSearching}
                                            className="flex items-center gap-2 hover:text-[var(--color-text-primary)] transition-all disabled:opacity-50 active:scale-95 py-1"
                                        >
                                            <RefreshCw size={14} className={isSearching ? 'animate-spin' : ''} />
                                            <span>换一批</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (selectedUrls.size === results.length) {
                                                    setSelectedUrls(new Set());
                                                } else {
                                                    setSelectedUrls(new Set(results.map(r => r.url)));
                                                }
                                            }}
                                            className="hover:text-[var(--color-text-primary)] transition-all active:scale-95 py-1"
                                        >
                                            {selectedUrls.size === results.length ? '取消全选' : '全选'}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {results.map((result) => (
                                        <div
                                            key={result.url}
                                            onClick={() => toggleSelection(result.url)}
                                            className={`card-glow group relative p-4 rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden ${selectedUrls.has(result.url) ? 'bg-[var(--color-bg-tertiary)]' : 'bg-[var(--color-bg-secondary)]'}`}
                                            style={{
                                                borderColor: selectedUrls.has(result.url) ? 'var(--color-border-hover)' : 'var(--color-border)',
                                                boxShadow: 'none',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!selectedUrls.has(result.url)) {
                                                    e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
                                                    e.currentTarget.style.borderColor = 'var(--color-border-hover)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = 'none';
                                                e.currentTarget.style.borderColor = selectedUrls.has(result.url) ? 'var(--color-border-hover)' : 'var(--color-border)';
                                            }}
                                        >
                                            <div className="flex flex-col gap-2 relative z-10">
                                                <div className="flex items-center min-w-0">
                                                    <div className="w-5 h-5 flex items-center justify-center shrink-0 overflow-hidden mr-2 rounded bg-[var(--color-bg-tertiary)] relative">
                                                        <Globe size={11} className="text-[var(--color-text-tertiary)] opacity-30" />
                                                        <img
                                                            src={`https://www.google.com/s2/favicons?domain=${(() => { try { return new URL(result.url).hostname; } catch { return ''; } })()}&sz=64`}
                                                            className="absolute inset-0 w-full h-full object-contain p-0.5 transition-opacity duration-300"
                                                            alt=""
                                                            loading="lazy"
                                                            onError={(e) => (e.target as HTMLImageElement).style.opacity = '0'}
                                                        />
                                                    </div>
                                                    <h3 className="font-bold text-[15px] truncate flex-1" style={{ color: 'var(--color-text-primary)' }}>
                                                        {result.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(result.url, '_blank');
                                                            }}
                                                            className="p-1 rounded-md transition-colors hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                                                        >
                                                            <ExternalLink size={14} />
                                                        </button>
                                                        {selectedUrls.has(result.url) && <Check size={16} className="text-[var(--color-accent)]" />}
                                                    </div>
                                                </div>
                                                <p className="text-[11px] leading-relaxed line-clamp-2 opacity-60" style={{ color: 'var(--color-text-secondary)' }}>
                                                    {result.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Standard Action Footer */}
                        <div className="p-6 flex items-center justify-end gap-3 bg-[var(--color-bg-secondary)] rounded-b-2xl border-t" style={{ borderColor: 'var(--color-border)' }}>
                            <button
                                onClick={onClose}
                                className="px-6 h-9 rounded-lg font-medium transition-all hover:bg-[var(--color-action-hover)] active:scale-95 text-sm"
                                style={{
                                    backgroundColor: 'var(--color-action-bg)',
                                    color: 'var(--color-text-secondary)'
                                }}
                            >
                                取消
                            </button>

                            <div className="relative category-select-container">
                                <button
                                    onClick={() => {
                                        if (results.length > 0 && selectedUrls.size > 0) {
                                            setIsCategoryOpen(!isCategoryOpen);
                                        }
                                    }}
                                    disabled={isSaving || results.length === 0 || selectedUrls.size === 0}
                                    className="group flex items-center gap-2 px-6 h-9 rounded-lg font-medium transition-all border disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                                    style={{
                                        backgroundColor: 'var(--color-text-primary)',
                                        borderColor: 'var(--color-text-primary)',
                                        color: 'var(--color-bg-primary)'
                                    }}
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    <span className="text-sm">{isSaving ? '保存中' : '保存'}</span>
                                </button>

                                {isCategoryOpen && (
                                    <div
                                        className="absolute right-0 bottom-full mb-4 w-64 z-50 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] border overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
                                        style={{
                                            backgroundColor: 'var(--color-bg-secondary)',
                                            borderColor: 'var(--color-border)',
                                        }}
                                    >
                                        <div className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] opacity-40 bg-[var(--color-bg-tertiary)] border-b" style={{ borderColor: 'var(--color-border)' }}>
                                            保存至分类
                                        </div>
                                        <div className="max-h-60 overflow-y-auto py-1">
                                            <button
                                                onClick={() => {
                                                    handleSave('new');
                                                    setIsCategoryOpen(false);
                                                }}
                                                className="w-full px-5 py-3.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-3 font-bold border-b"
                                                style={{ color: 'var(--color-accent)', borderColor: 'var(--color-border)' }}
                                            >
                                                <Plus size={16} />
                                                为这些站点新建分类
                                            </button>
                                            {categories.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => {
                                                        handleSave(cat.id);
                                                        setIsCategoryOpen(false);
                                                    }}
                                                    className="w-full px-5 py-3.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-3"
                                                    style={{ color: 'var(--color-text-primary)' }}
                                                >
                                                    <div className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] opacity-20" />
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
