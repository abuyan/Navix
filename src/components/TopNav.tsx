'use client';

import { Settings, ChevronDown, Upload, Search, ExternalLink } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import ImportModal from './ImportModal';
import { useState, useRef, useEffect } from 'react';

export type SearchResult = {
    id: string;
    title: string;
    description: string | null;
    url: string;
    categoryId: string;
    categoryName: string;
};

type NavItem = {
    id: string;
    name: string;
    href?: string;
    isActive?: boolean;
};

const defaultNavItems: NavItem[] = [
    { id: 'tools', name: '工具导航', isActive: true },
    { id: 'news', name: '新闻资讯' },
    { id: 'ai', name: 'AI 导航' },
    { id: 'fonts', name: '字体导航' },
    { id: 'design', name: '设计导航' },
];

export default function TopNav({
    navItems = defaultNavItems,
    activeNav,
    onNavChange,
    sidebarCollapsed,
    searchResults = [],
    onResultSelect,
    onResultFocus
}: {
    navItems?: NavItem[];
    activeNav?: string;
    onNavChange?: (id: string) => void;
    sidebarCollapsed: boolean;
    searchResults?: SearchResult[];
    onResultSelect: (result: SearchResult) => void;
    onResultFocus?: (result: SearchResult) => void;
}) {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const currentActive = activeNav || navItems[0]?.id;

    // 快捷键监听：Ctrl+F 或 Cmd+F
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                inputRef.current?.focus();
                setShowResults(true);
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    const filteredResults = searchQuery.trim()
        ? searchResults.filter(site =>
            site.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (site.description && site.description.toLowerCase().includes(searchQuery.toLowerCase()))
        ).slice(0, 8)
        : [];

    useEffect(() => {
        setActiveIndex(-1);
    }, [searchQuery, searchResults.length]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                window.open(result.url, '_blank');
                onResultSelect(result);
                setSearchQuery('');
                setShowResults(false);
            }
        } else if (e.key === 'Escape') {
            setShowResults(false);
        }
    };

    const handleOpenImport = () => {
        setSettingsOpen(false);
        setImportModalOpen(true);
    };

    return (
        <>
            <header
                className={`fixed top-0 right-0 z-50 h-14 flex items-center justify-between px-6 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'left-[72px]' : 'left-64'} hidden md:flex`}
                style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderBottom: '1px solid var(--color-border)'
                }}
            >
                {/* 一级导航菜单 */}
                <nav className="flex items-center gap-1">
                    {navItems.map((item) => {
                        const isActive = currentActive === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavChange?.(item.id)}
                                className="relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
                                style={{
                                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                    backgroundColor: isActive ? 'var(--color-accent-soft)' : 'transparent'
                                }}
                            >
                                {item.name}
                                {isActive && (
                                    <span
                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                                        style={{ backgroundColor: 'var(--color-accent)' }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* 搜索框 */}
                <div className="flex-1 max-w-md mx-8 relative" ref={searchRef}>
                    <div className="relative group">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors group-focus-within:text-[var(--color-accent)]"
                            style={{ color: 'var(--color-text-tertiary)' }}
                        />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="搜索站点..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border transition-all outline-none"
                            style={{
                                backgroundColor: 'var(--color-bg-tertiary)',
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-primary)'
                            }}
                        />
                    </div>

                    {/* 搜索结果下拉面板 */}
                    {showResults && searchQuery.trim() && (
                        <div
                            className="absolute top-full left-0 right-0 mt-2 py-2 rounded-xl border z-50"
                            style={{
                                backgroundColor: 'var(--color-bg-secondary)',
                                borderColor: 'var(--color-border)',
                                boxShadow: 'var(--shadow-lg)'
                            }}
                        >
                            {filteredResults.length > 0 ? (
                                filteredResults.map((result, index) => (
                                    <div key={result.id} className="relative group/item">
                                        <button
                                            onClick={() => {
                                                window.open(result.url, '_blank');
                                                onResultSelect(result);
                                                setSearchQuery('');
                                                setShowResults(false);
                                            }}
                                            onMouseEnter={() => {
                                                setActiveIndex(index);
                                            }}
                                            className="w-full px-4 py-2.5 text-left transition-colors group"
                                            style={{
                                                backgroundColor: activeIndex === index ? 'var(--color-bg-tertiary)' : 'transparent'
                                            }}
                                        >
                                            <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                                {result.title}
                                            </div>
                                            <div className="text-xs flex items-center justify-between" style={{ color: 'var(--color-text-tertiary)' }}>
                                                <span className="truncate flex-1 mr-4">{result.description || '暂无描述'}</span>
                                                <span className="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] group-hover:bg-[var(--color-bg-primary)] shrink-0">
                                                    {result.categoryName}
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                                    没有找到相关站点
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 右侧工具栏 */}
                <div className="flex items-center gap-3">
                    {/* 主题切换 */}
                    <ThemeToggle />

                    {/* 设置按钮 */}
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
                                    <button
                                        className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        账户设置
                                    </button>
                                    <button
                                        onClick={handleOpenImport}
                                        className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center gap-2"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        <Upload className="w-4 h-4" />
                                        导入书签
                                    </button>
                                    <button
                                        className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        导出数据
                                    </button>
                                    <div
                                        className="my-2 mx-3 h-px"
                                        style={{ backgroundColor: 'var(--color-border)' }}
                                    />
                                    <button
                                        className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-bg-tertiary)]"
                                        style={{ color: 'var(--color-text-tertiary)' }}
                                    >
                                        关于 Navix
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* 导入书签弹窗 */}
            <ImportModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                onSuccess={() => window.location.reload()}
            />
        </>
    );
}

