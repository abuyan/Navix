'use client';

import { ChevronDown, Plus, Search, ExternalLink, Layout, Cpu, FolderPlus, User, LogOut, Info, Settings } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import PanelModal from './PanelModal';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export type SearchResult = {
    id: string;
    title: string;
    description: string | null;
    url: string;
    icon?: string | null;
    categoryId: string;
    categoryName: string;
    panelId?: string;
    panelSlug?: string;
    panelName?: string;
};

const FIXED_NAV_ITEMS = [];

export default function TopNav({
    sidebarCollapsed,
    activePanelId, // New prop to identify current panel
    panels = [], // New prop: panels data from server
    user, // New prop: current user
    authStatus = 'loading', // New prop: 'loading' | 'authenticated' | 'unauthenticated'
    onResultSelect,
    onResultFocus
}: {
    sidebarCollapsed?: boolean;
    activePanelId?: string;
    panels?: any[];
    user?: any;
    authStatus?: 'loading' | 'authenticated' | 'unauthenticated';
    onResultSelect?: (result: SearchResult) => void;
    onResultFocus?: (result: SearchResult) => void;
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
    const searchRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);



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

    const navItems = panels.map(p => ({
        id: p.id,
        name: p.name,
        href: p.slug === 'home' ? '/' : `/p/${p.slug || p.id}`
    }));

    // 搜索结果状态
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // API搜索（带防抖）
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        const query = searchQuery.trim();
        if (!query) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300); // 300ms防抖

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

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
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setSettingsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [searchExpanded, searchQuery]); // Depend on searchExpanded and searchQuery to re-evaluate handlers

    const filteredResults = searchResults.slice(0, 10);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showResults || filteredResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = activeIndex < filteredResults.length - 1 ? activeIndex + 1 : 0;
            setActiveIndex(nextIndex);

            // 如果在当前收藏夹，进行预览定位
            const result = filteredResults[nextIndex];
            if (result && result.panelId === activePanelId && onResultFocus) {
                onResultFocus(result);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = activeIndex > 0 ? activeIndex - 1 : filteredResults.length - 1;
            setActiveIndex(prevIndex);

            // 如果在当前收藏夹，进行预览定位
            const result = filteredResults[prevIndex];
            if (result && result.panelId === activePanelId && onResultFocus) {
                onResultFocus(result);
            }
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0) {
                handleResultClick(filteredResults[activeIndex]);
            }
        }
        // Escape key handled by global useEffect
    };

    // 处理搜索结果点击
    const handleResultClick = (result: SearchResult) => {
        // 直接打开外部链接
        window.open(result.url, '_blank');

        // 如果是当前收藏夹，触发定位逻辑
        if (result.panelId === activePanelId && onResultSelect) {
            onResultSelect(result);
        } else if (result.panelSlug) {
            // 如果是跨收藏夹，跳转到对应收藏夹页面，并通过 URL 参数传递 siteId 用于定位
            router.push(`/p/${result.panelSlug}?siteId=${result.id}`);
        }

        setSearchQuery('');
        setShowResults(false);
        setSearchExpanded(false);
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
                    {/* 收藏夹按钮 */}
                    {user && (
                        <button
                            onClick={() => setIsPanelModalOpen(true)}
                            className="p-2 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)]"
                            style={{
                                color: 'var(--color-text-secondary)'
                            }}
                            title="新增收藏夹"
                        >
                            <FolderPlus size={18} />
                        </button>
                    )}

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
                                    placeholder="搜索书签..."
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

                                {showResults && (searchResults.length > 0 || isSearching) && (
                                    <div
                                        className="absolute top-full right-0 mt-2 w-96 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[calc(100vh-100px)] overflow-y-auto"
                                        style={{
                                            backgroundColor: 'var(--color-bg-secondary)',
                                            border: '1px solid var(--color-border)',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                    >
                                        {isSearching ? (
                                            <div className="p-8 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce" style={{ animationDelay: '0s' }}></div>
                                                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                </div>
                                                <p className="text-xs">正在搜索所有收藏夹...</p>
                                            </div>
                                        ) : (
                                            filteredResults.map((result, index) => (
                                                <button
                                                    key={result.id}
                                                    onClick={() => handleResultClick(result)}
                                                    onMouseEnter={() => setActiveIndex(index)}
                                                    className="w-full px-4 py-3 text-left transition-colors flex items-start gap-4 group"
                                                    style={{
                                                        backgroundColor: index === activeIndex ? 'var(--color-bg-tertiary)' : 'transparent',
                                                        borderBottom: index < filteredResults.length - 1 ? '1px solid var(--color-border)' : 'none'
                                                    }}
                                                >
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[var(--color-bg-tertiary)] group-hover:bg-[var(--color-bg-primary)] transition-colors">
                                                        {result.icon ? (
                                                            <img src={result.icon} alt="" className="w-5 h-5 object-contain" />
                                                        ) : (
                                                            <ExternalLink size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-sm mb-0.5 truncate group-hover:text-[var(--color-accent)] transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                                                            {result.title}
                                                        </div>
                                                        {result.description && (
                                                            <div className="text-xs line-clamp-1 mb-1.5 opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                                                                {result.description}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] uppercase tracking-wider font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                                                                {result.panelName}
                                                            </span>
                                                            <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                                                                {result.categoryName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                                {showResults && !isSearching && filteredResults.length === 0 && searchQuery.trim() && (
                                    <div
                                        className="absolute top-full right-0 mt-2 w-64 py-8 rounded-lg z-50"
                                        style={{
                                            backgroundColor: 'var(--color-bg-secondary)',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    >
                                        <div className="px-4 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                                            没有找到相关书签
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 主题切换 */}
                    <ThemeToggle />

                    {/* 设置按钮 / 登录按钮 */}
                    {authStatus === 'loading' ? (
                        /* 加载中：显示占位符防止闪烁 */
                        <div className="w-20" />
                    ) : authStatus === 'authenticated' && user ? (
                        <div className="relative" ref={settingsRef}>
                            <button
                                onClick={() => setSettingsOpen(!settingsOpen)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 hover:bg-[var(--color-bg-tertiary)]"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                {/* 用户头像 */}
                                {user.image ? (
                                    <img
                                        src={user.image}
                                        alt={user.name || 'User'}
                                        className="w-7 h-7 rounded-full object-cover"
                                    />
                                ) : (
                                    <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium"
                                        style={{
                                            backgroundColor: 'var(--color-accent-soft)',
                                            color: 'var(--color-accent)'
                                        }}
                                    >
                                        {(user.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                                    </div>
                                )}
                                <span className="hidden lg:inline text-sm font-medium max-w-[120px] truncate">
                                    {user.name || user.email?.split('@')[0] || 'User'}
                                </span>
                                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--color-text-tertiary)' }} />
                            </button>

                            {/* 设置下拉菜单 */}
                            {settingsOpen && (
                                <>
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
                                        <Link
                                            href="/settings"
                                            className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-2"
                                            style={{ color: 'var(--color-text-primary)' }}
                                            onClick={() => setSettingsOpen(false)}
                                        >
                                            <Settings className="w-4 h-4" />
                                            设置
                                        </Link>
                                        <div
                                            className="my-2 mx-3 h-px"
                                            style={{ backgroundColor: 'var(--color-border)' }}
                                        />
                                        <button
                                            onClick={() => signOut({ callbackUrl: '/' })}
                                            className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-2"
                                            style={{ color: 'var(--color-text-primary)' }}
                                        >
                                            <LogOut className="w-4 h-4" />
                                            退出登录
                                        </button>
                                        <button
                                            className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-2"
                                            style={{ color: 'var(--color-text-tertiary)' }}
                                        >
                                            <Info className="w-4 h-4" />
                                            关于 Navix
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        /* 未登录：显示注册和登录按钮 */
                        <div className="flex items-center gap-2">
                            <Link
                                href="/register"
                                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:opacity-90"
                                style={{
                                    backgroundColor: 'var(--color-text-primary)',
                                    color: 'var(--color-bg-primary)'
                                }}
                            >
                                注册
                            </Link>
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
                        </div>
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

