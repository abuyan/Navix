'use client';

import { Settings, ChevronDown, Plus, Search, ExternalLink, Layout, Cpu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import PanelModal from './PanelModal';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export type SearchResult = {
    id: string;
    title: string;
    description: string | null;
    url: string;
    categoryId: string;
    categoryName: string;
};

const FIXED_NAV_ITEMS = [];

export default function TopNav({
    sidebarCollapsed,
    searchResults = [],
    onResultSelect,
    onResultFocus,
    activePanelId, // New prop to identify current panel
    panels = [], // New prop: panels data from server
    user // New prop: current user
}: {
    sidebarCollapsed?: boolean;
    searchResults?: SearchResult[];
    onResultSelect?: (result: SearchResult) => void;
    onResultFocus?: (result: SearchResult) => void;
    activePanelId?: string;
    panels?: any[];
    user?: any;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isPanelModalOpen, setIsPanelModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [searchExpanded, setSearchExpanded] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchRef = useRef<HTMLDivElement>(null); // Ref for the entire search area (button + input)



    // Determine active item based on pathname and panels
    const getCurrentActiveId = () => {
        if (pathname === '/') {
            // Default to the first panel if on home
            return panels[0]?.id || 'home';
        }

        // Find panel by slug or id in pathname
        const panel = panels.find(p => p.slug === pathname.split('/')[2] || p.id === pathname.split('/')[2]);
        return panel?.id || '';
    };

    const currentActiveId = activePanelId || getCurrentActiveId();

    // Generate full nav list: Panels
    const navItems = panels.map(p => ({
        id: p.id,
        name: p.name,
        href: p.slug === 'home' ? '/' : `/p/${p.slug || p.id}`
    }));

    useEffect(() => {
        setActiveIndex(-1);
    }, [searchQuery, searchResults.length]);

    // Global keyboard shortcuts (Ctrl+F, Escape) and click outside to close search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                setSearchExpanded(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
            }
            if (e.key === 'Escape' && searchExpanded) {
                setSearchExpanded(false);
                setSearchQuery('');
                setShowResults(false);
                searchInputRef.current?.blur(); // Remove focus
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                if (!searchQuery) { // Only collapse if search query is empty
                    setSearchExpanded(false);
                }
                setShowResults(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [searchExpanded, searchQuery]); // Depend on searchExpanded and searchQuery to re-evaluate handlers

    const filteredResults = searchQuery.trim()
        ? searchResults.filter(site =>
            site.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (site.description && site.description.toLowerCase().includes(searchQuery.toLowerCase()))
        ).slice(0, 8)
        : [];

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showResults || filteredResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = activeIndex < filteredResults.length - 1 ? activeIndex + 1 : 0;
            setActiveIndex(nextIndex);
            onResultFocus?.(filteredResults[nextIndex]);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = activeIndex > 0 ? activeIndex - 1 : filteredResults.length - 1;
            setActiveIndex(prevIndex);
            onResultFocus?.(filteredResults[prevIndex]);
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0) {
                const result = filteredResults[activeIndex];
                if (result.url.startsWith('/')) {
                    router.push(result.url);
                } else {
                    window.open(result.url, '_blank');
                }
                onResultSelect?.(result);
                setSearchQuery('');
                setShowResults(false);
                setSearchExpanded(false); // Collapse after selection
            }
        }
        // Escape key handled by global useEffect
    };

    const handleOpenPanelModal = () => {
        setSettingsOpen(false);
        setIsPanelModalOpen(true);
    };

    return (
        <>
            <header
                className={`fixed top-0 right-0 z-50 h-16 flex items-center justify-between px-6 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'md:left-[72px]' : 'md:left-64'} hidden md:flex`}
                style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-bg-primary), transparent 15%)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderBottom: '1px solid var(--color-border)'
                }}
            >
                {/* 一级导航菜单 */}
                <nav className="flex items-center gap-1">
                    {navItems.map((item) => {
                        const isActive = currentActiveId === item.id;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-[var(--color-bg-tertiary)]"
                                style={{
                                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                }}
                            >
                                {item.name}
                                {isActive && (
                                    <span
                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[1.5px] rounded-full"
                                        style={{ backgroundColor: 'var(--color-text-primary)' }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* 右侧工具栏 */}
                <div className="flex items-center gap-3">
                    {/* 搜索按钮/输入框 */}
                    <div className="relative" ref={searchRef}>
                        {!searchExpanded ? (
                            <button
                                onClick={() => {
                                    setSearchExpanded(true);
                                    setTimeout(() => searchInputRef.current?.focus(), 100);
                                }}
                                className="p-2 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)]"
                                style={{
                                    color: 'var(--color-text-secondary)'
                                }}
                                title="搜索 (Ctrl+F)"
                            >
                                <Search size={18} />
                            </button>
                        ) : (
                            <div className="relative">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowResults(e.target.value.length > 0);
                                        setActiveIndex(-1);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    onBlur={() => {
                                        setTimeout(() => {
                                            if (!searchQuery) {
                                                setSearchExpanded(false);
                                            }
                                            setShowResults(false);
                                        }, 200);
                                    }}
                                    placeholder="搜索站点..."
                                    className="w-64 px-3 py-1.5 pl-9 pr-8 rounded-lg text-sm transition-all outline-none focus:border-[var(--color-border-hover)]"
                                    style={{
                                        backgroundColor: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text-primary)'
                                    }}
                                />
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ color: 'var(--color-text-tertiary)' }}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setShowResults(false);
                                            searchInputRef.current?.focus();
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--color-bg-secondary)]"
                                        style={{ color: 'var(--color-text-tertiary)' }}
                                    >
                                        ×
                                    </button>
                                )}

                                {/* 搜索结果下拉框 */}
                                {showResults && filteredResults.length > 0 && (
                                    <div
                                        className="absolute top-full right-0 mt-2 w-96 rounded-lg shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto"
                                        style={{
                                            backgroundColor: 'var(--color-bg-secondary)',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    >
                                        {filteredResults.map((result, index) => (
                                            <button
                                                key={result.id}
                                                onClick={() => {
                                                    if (result.url.startsWith('/')) {
                                                        router.push(result.url);
                                                    } else {
                                                        window.open(result.url, '_blank');
                                                    }
                                                    onResultSelect?.(result);
                                                    setSearchQuery('');
                                                    setShowResults(false);
                                                    setSearchExpanded(false);
                                                }}
                                                onMouseEnter={() => setActiveIndex(index)}
                                                className="w-full px-4 py-3 text-left transition-colors flex items-start gap-3"
                                                style={{
                                                    backgroundColor: index === activeIndex ? 'var(--color-accent-soft)' : 'transparent',
                                                    borderBottom: index < filteredResults.length - 1 ? '1px solid var(--color-border)' : 'none'
                                                }}
                                            >
                                                {result.url.startsWith('/') ? (
                                                    <Search size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                                                ) : (
                                                    <ExternalLink size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                                                        {result.title}
                                                    </div>
                                                    {result.description && (
                                                        <div className="text-xs line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>
                                                            {result.description}
                                                        </div>
                                                    )}
                                                    <div className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                                                        {result.categoryName}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {showResults && filteredResults.length === 0 && searchQuery.trim() && (
                                    <div
                                        className="absolute top-full right-0 mt-2 w-64 py-8 rounded-lg z-50"
                                        style={{
                                            backgroundColor: 'var(--color-bg-secondary)',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    >
                                        <div className="px-4 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                                            没有找到相关站点
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 主题切换 */}
                    <ThemeToggle />

                    {/* 设置按钮 / 登录按钮 */}
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setSettingsOpen(!settingsOpen)}
                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-[var(--color-bg-tertiary)]"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                <Settings className="w-4 h-4" />
                                <span className="hidden lg:inline">设置</span>
                                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* 设置下拉菜单 */}
                            {settingsOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setSettingsOpen(false)}
                                    />
                                    <div
                                        className="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl z-50"
                                        style={{
                                            backgroundColor: 'var(--color-bg-secondary)',
                                            border: '1px solid var(--color-border)',
                                            boxShadow: 'var(--shadow-lg)'
                                        }}
                                    >
                                        <div className="px-4 py-2 text-xs font-semibold opacity-50 border-b mb-1" style={{ borderColor: 'var(--color-border)' }}>
                                            {user.name || user.email || 'Admin'}
                                        </div>
                                        <button
                                            onClick={handleOpenPanelModal}
                                            className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-2"
                                            style={{ color: 'var(--color-text-primary)' }}
                                        >
                                            <Plus className="w-4 h-4" />
                                            新增导航
                                        </button>
                                        <Link
                                            href="/settings?tab=panels"
                                            className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-2"
                                            style={{ color: 'var(--color-text-primary)' }}
                                            onClick={() => setSettingsOpen(false)}
                                        >
                                            <Layout className="w-4 h-4" />
                                            导航管理
                                        </Link>
                                        <Link
                                            href="/settings?tab=ai"
                                            className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-2"
                                            style={{ color: 'var(--color-text-primary)' }}
                                            onClick={() => setSettingsOpen(false)}
                                        >
                                            <Cpu className="w-4 h-4" />
                                            AI 配置
                                        </Link>
                                        <div
                                            className="my-2 mx-3 h-px"
                                            style={{ backgroundColor: 'var(--color-border)' }}
                                        />
                                        <button
                                            onClick={() => {
                                                import('@/lib/actions').then(mod => mod.handleSignOut());
                                            }}
                                            className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-2"
                                            style={{ color: 'var(--color-text-primary)' }}
                                        >
                                            退出登录
                                        </button>
                                        <div
                                            className="my-2 mx-3 h-px"
                                            style={{ backgroundColor: 'var(--color-border)' }}
                                        />
                                        <button
                                            className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
                                            style={{ color: 'var(--color-text-tertiary)' }}
                                        >
                                            关于 Nivix
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        /* 未登录：直接显示登录按钮 */
                        <Link
                            href="/login"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-[var(--color-bg-tertiary)]"
                            style={{
                                color: 'var(--color-text-primary)',
                                border: '1px solid var(--color-border)'
                            }}
                        >
                            <span>登录</span>
                        </Link>
                    )}
                </div>
            </header >

            {/* 新增版块弹窗 */}
            < PanelModal
                isOpen={isPanelModalOpen}
                onClose={() => setIsPanelModalOpen(false)
                }
                onSuccess={() => window.location.reload()}
            />
        </>
    );
}

