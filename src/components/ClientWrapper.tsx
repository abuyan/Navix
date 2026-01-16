'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav, { SearchResult } from '@/components/TopNav';
import SiteCard from '@/components/SiteCard';
import CategoryTitle from './CategoryTitle';
import DndProvider from './DndProvider';
import { Category, Site } from '@prisma/client';
import { Menu, X, Layout, Settings, LogOut, ChevronRight, Folder } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { updateCategory } from '@/lib/category-api';
import { CategoryEditModal } from './CategoryEditModal';
import PageToolbar, { SortBy, SortOrder } from './PageToolbar';
import ImportModal from './ImportModal';
import { SiteEditModal } from './SiteEditModal';
import { useToast } from './Toast';
import ConfirmModal from './ConfirmModal';
import { useSession, signOut } from 'next-auth/react';
import { useBatchAI } from '@/contexts/BatchAIContext';
import { useSearchParams } from 'next/navigation';
import AITaskIndicator from './AITaskIndicator';
import { AIDiscoveryModal } from './AIDiscoveryModal';
import BackToTop from './BackToTop';

type CategoryWithSites = Category & { sites: Site[] };

export default function ClientWrapper({
    initialCategories,
    panelId,
    panels,
    user,
    readOnly = false,
    owner
}: {
    initialCategories: CategoryWithSites[],
    panelId: string,
    panels: any[],
    user?: any,
    readOnly?: boolean,
    owner?: { name: string | null }
}) {
    const { data: session, status } = useSession();
    const { showToast } = useToast();
    const { isBatchAnalyzing, batchProgress, startBatchAnalysis, startBatchCategorization, startBatchIconGeneration, subscribe } = useBatchAI();
    const searchParams = useSearchParams();

    // Subscribe to background AI analysis updates
    useEffect(() => {
        if (readOnly) return; // Don't subscribe if read-only
        const unsubscribe = subscribe((updatedSite) => {
            const unsubscribe = subscribe((updatedSite) => {
                setCategories(prev => {
                    // Check if this is a move operation (site exists in a different category)
                    let oldCategoryId: string | null = null;
                    for (const cat of prev) {
                        if (cat.sites.some(s => s.id === updatedSite.id)) {
                            oldCategoryId = cat.id;
                            break;
                        }
                    }

                    // If site wasn't found or category didn't change, use simple update
                    if (!oldCategoryId || oldCategoryId === updatedSite.categoryId) {
                        return prev.map(cat => {
                            if (cat.id !== updatedSite.categoryId) return cat;
                            return {
                                ...cat,
                                sites: cat.sites.map(s => s.id === updatedSite.id ? { ...s, ...updatedSite } : s)
                            };
                        });
                    }

                    // Handle Move: Remove from old, Add to new
                    return prev.map(cat => {
                        if (cat.id === oldCategoryId) {
                            return { ...cat, sites: cat.sites.filter(s => s.id !== updatedSite.id) };
                        }
                        if (cat.id === updatedSite.categoryId) {
                            // Check if site already exists in target (shouldn't happen but safe)
                            if (cat.sites.some(s => s.id === updatedSite.id)) return cat;
                            // Add to new category (potentially merged with existing data if we had full site object)
                            // Since updatedSite might only have partial data, we should try to find the full site object first
                            const existingSite = prev.find(c => c.id === oldCategoryId)?.sites.find(s => s.id === updatedSite.id);
                            const newSite = { ...existingSite!, ...updatedSite }; // Merge

                            return { ...cat, sites: [...cat.sites, newSite] };
                        }
                        return cat;
                    });
                });
            });
        });
        return unsubscribe;
    }, [subscribe, readOnly]);

    const [categories, setCategories] = useState(initialCategories);
    const initialId = categories.length > 0 ? categories[0].id : '';
    const [activeCategory, setActiveCategory] = useState(initialId);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeNav, setActiveNav] = useState('tools');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isAddingSite, setIsAddingSite] = useState(false);
    const [sortBy, setSortBy] = useState<SortBy>('visits');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    const [aiConfigured, setAiConfigured] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryWithSites | null>(null);
    const [isAIDiscoveryOpen, setIsAIDiscoveryOpen] = useState(false);

    // 监听窗口宽度，小于 1000px 自动收起侧边栏
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1000) {
                setSidebarCollapsed(true);
            }
        };

        // 初始化检查一次
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 处理跨收藏夹定位逻辑 (从 URL 参数获取 siteId)
    useEffect(() => {
        const siteId = searchParams.get('siteId');
        if (siteId) {
            // 在所有分类中查找该网站
            for (const cat of categories) {
                const site = cat.sites.find(s => s.id === siteId);
                if (site) {
                    scrollToSite(siteId, cat.id);
                    break;
                }
            }
        }
    }, [searchParams, categories]);
    // Removed local isBatchAnalyzing and batchProgress state
    const isScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleCategoryChange = (id: string) => {
        setActiveCategory(id);
        // 设置滚动标志，防止 IntersectionObserver 干扰
        isScrollingRef.current = true;
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
            isScrollingRef.current = false;
        }, 1000);

        // Scroll Logic
        const container = document.getElementById('main-scroll-container');
        const element = document.getElementById(id);
        if (container && element) {
            const offset = 20; // Slight offset for spacing
            const elementTop = element.getBoundingClientRect().top;
            const containerTop = container.getBoundingClientRect().top;
            const offsetPosition = elementTop - containerTop + container.scrollTop - offset;

            container.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    const scrollToSite = (siteId: string, categoryId: string) => {
        // 首先切换到对应的分类（更新侧边栏激活状态）
        handleCategoryChange(categoryId);

        // 延迟滚动，确保分类已经渲染或展示
        setTimeout(() => {
            const container = document.getElementById('main-scroll-container');
            const element = document.getElementById(`site-${siteId}`);

            if (container && element) {
                const offset = 100;
                // Calculations for scrolling inside a container
                const elementTop = element.getBoundingClientRect().top;
                const containerTop = container.getBoundingClientRect().top;
                const offsetPosition = elementTop - containerTop + container.scrollTop - offset; // Relative position

                container.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });

                // 增加一个短暂的高亮效果
                element.classList.add('search-highlight');
                setTimeout(() => element.classList.remove('search-highlight'), 2000);
            } else if (container) {
                // 如果找不到具体的网页元素（可能在尚未渲染的分类中），就滚到分类
                const categoryElement = document.getElementById(categoryId);
                if (categoryElement) {
                    const elementTop = categoryElement.getBoundingClientRect().top;
                    const containerTop = container.getBoundingClientRect().top;
                    const offsetPosition = elementTop - containerTop + container.scrollTop - 20;

                    container.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        }, 100);
    };

    const handleConfirmClearEmpty = async () => {
        try {
            const response = await fetch('/api/categories/clear-empty', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ panelId }),
            });

            if (!response.ok) throw new Error('Failed to clear empty categories');

            const data = await response.json();

            if (data.count > 0) {
                // Determine if we need to reload or just update state.
                // Since this deletes categories, we can technically filter them locally.
                setCategories(prev => prev.filter(cat => cat.sites.length > 0));
                showToast(`已清理 ${data.count} 个空分类`, 'success');
            } else {
                showToast('没有发现空分类', 'info');
            }
        } catch (error) {
            console.error('Failed to clear empty categories:', error);
            showToast('清理失败', 'error');
        }
    };

    const handleBatchAIAnalyze = async () => {
        const allSites = categories.flatMap(c => c.sites);
        await startBatchAnalysis(allSites);
    };

    const handleAIDiscoverAddSites = async (sites: { title: string, url: string, description: string }[], categoryId: string | 'new') => {
        try {
            let actualCategoryId = categoryId;

            // 如果是新建分类
            if (categoryId === 'new') {
                const response = await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: 'AI 发现', panelId }),
                });
                if (!response.ok) throw new Error('Failed to create AI category');
                const newCategory = await response.json();
                actualCategoryId = newCategory.id;
                // 注意：这里我们不需要手动更新 categories 状态，因为后续批量添加站点后会触发刷新（或者我们可以局部添加）
                // 为了简单且确保正确，我们先只处理站点的批量添加，然后刷新页面
            }

            // 批量添加站点
            const promises = sites.map(site => fetch('/api/sites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...site, categoryId: actualCategoryId }),
            }));

            await Promise.all(promises);
            window.location.reload(); // 简单起见，刷新页面以加载所有新分类和站点
        } catch (error) {
            console.error('Failed to add discovered sites:', error);
            throw error;
        }
    };

    useEffect(() => {
        // Check AI config status
        const checkAIStatus = async () => {
            try {
                const res = await fetch('/api/ai/status');
                const data = await res.json();
                setAiConfigured(data.configured);
            } catch (e) {
                setAiConfigured(false);
            }
        };
        if (user) checkAIStatus();
    }, [user, isImporting, isAddingSite]); // Re-check when dialogs close (settings might change)

    useEffect(() => {
        if (categories.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (isScrollingRef.current) return; // 如果正在手动滚动，忽略观察器

                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
                        setActiveCategory(entry.target.id);
                    }
                });
            },
            { rootMargin: '-20% 0px -60% 0px', threshold: 0.1 }
        );

        categories.forEach((cat) => {
            const element = document.getElementById(cat.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [categories]);

    return (
        <DndProvider>
            {/* Sidebar (Desktop) - Fixed position, left side */}
            <Sidebar
                user={readOnly ? undefined : user}
                categories={categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    icon: cat.icon,
                    sitesCount: cat.sites.length
                }))}
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                onCategoriesReorder={readOnly ? undefined : (reorderedCategories) => {
                    // 合并新顺序和原有的 sites 数据
                    const newCategories: CategoryWithSites[] = reorderedCategories.map(cat => {
                        const existingCategory = categories.find(c => c.id === cat.id);
                        return {
                            ...existingCategory!,
                            ...cat,
                            sites: existingCategory?.sites || []
                        } as CategoryWithSites;
                    });
                    setCategories(newCategories);
                }}
                onCategoryDoubleClick={(id) => {
                    const cat = categories.find(c => c.id === id);
                    if (cat) setEditingCategory(cat);
                }}
            />

            {/* Mobile Header - Fixed at top */}
            <div
                className="md:hidden fixed top-0 w-full z-50 px-4 py-3 flex items-center justify-between transition-colors"
                style={{
                    backgroundColor: 'var(--sidebar-bg)',
                    borderBottom: '1px solid var(--sidebar-border)'
                }}
            >
                <span
                    className="font-bold text-lg"
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    Nivix 灵犀书签
                </span>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? (
                            <X style={{ color: 'var(--color-text-secondary)' }} />
                        ) : (
                            <Menu style={{ color: 'var(--color-text-secondary)' }} />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 pt-16 md:hidden overflow-y-auto"
                    style={{ backgroundColor: 'var(--sidebar-bg)' }}
                >
                    <div className="p-4 space-y-6 pb-20">
                        {/* 收藏夹列表 (Panels) */}
                        <div>
                            <div className="px-4 mb-3 flex items-center gap-2">
                                <Layout size={14} className="text-[var(--color-text-tertiary)]" />
                                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">收藏夹</span>
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                                {panels.map(panel => {
                                    const isActive = panel.id === panelId;
                                    return (
                                        <button
                                            key={panel.id}
                                            onClick={() => {
                                                const url = panel.slug === 'home' ? '/' : `/p/${panel.slug || panel.id}`;
                                                setMobileMenuOpen(false);
                                                window.location.href = url;
                                            }}
                                            className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200"
                                            style={{
                                                backgroundColor: isActive ? 'var(--color-accent-soft)' : 'transparent',
                                                color: isActive ? 'var(--color-accent)' : 'var(--color-text-primary)'
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Folder size={18} className={isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)]'} />
                                                <span className="font-medium">{panel.name}</span>
                                            </div>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isActive ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'}`}>
                                                {(panel as any).siteCount || 0}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 系统操作 */}
                        <div className="pt-4 border-t border-[var(--sidebar-border)]">
                            {status === 'authenticated' ? (
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        signOut({ callbackUrl: '/' });
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                                >
                                    <LogOut size={18} className="text-[var(--color-text-tertiary)]" />
                                    <span className="font-medium">退出登录</span>
                                </button>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            window.location.href = '/login';
                                        }}
                                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all text-sm border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
                                    >
                                        登录
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            window.location.href = '/register';
                                        }}
                                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all text-sm hover:opacity-90 active:scale-[0.98]"
                                        style={{
                                            backgroundColor: 'var(--color-text-primary)',
                                            color: 'var(--color-bg-primary)'
                                        }}
                                    >
                                        注册
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Content Wrapper - Handles offset and flow */}
            <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64'}`}>
                {/* Top Navigation (Desktop) - Sticky inside content wrapper */}
                <div className="flex-none z-30 bg-[var(--color-bg-primary)]">
                    <TopNav
                        sidebarCollapsed={sidebarCollapsed}
                        activePanelId={panelId}
                        panels={panels}
                        user={user}
                        authStatus={status === 'loading' ? 'loading' : (session ? 'authenticated' : 'unauthenticated')}
                        onResultSelect={(result) => scrollToSite(result.id, result.categoryId)}
                        onResultFocus={(result) => scrollToSite(result.id, result.categoryId)}
                    />
                </div>

                {/* Main Content Area - Scrollable */}
                <main
                    id="main-scroll-container"
                    className="flex-1 overflow-y-auto scroll-smooth"
                    style={{ backgroundColor: 'var(--color-bg-primary)' }}
                >
                    {/* Add padding for TopNav is NOT needed as padding-top because nav is not fixed anymore, it is flex item. 
                        But getting back to top works better if we have some padding? 
                        The original code had pt-24. Since TopNav is now in flow, we don't need top padding to clear it.
                        However, we want some spacing.
                    */}
                    <div className="max-w-full mx-auto px-4 sm:px-10 py-8 space-y-6 min-h-full">

                        {/* 页面工具栏 - Only show if user is authenticated AND not read-only */}
                        {user && !readOnly && (
                            <PageToolbar
                                user={user}
                                panelName={panels.find(p => p.id === panelId)?.name}
                                isPublic={panels.find(p => p.id === panelId)?.isPublic}
                                panelSlug={panels.find(p => p.id === panelId)?.slug}
                                panelId={panelId}
                                onAddCategory={() => setIsCreatingCategory(true)}
                                onAddSite={() => setIsAddingSite(true)}
                                onImport={() => setIsImporting(true)}
                                onBatchAI={handleBatchAIAnalyze}
                                onAICategorize={async () => {
                                    const allSites = categories.flatMap(c => c.sites);
                                    const simpleCategories = categories.map(c => ({ id: c.id, name: c.name }));
                                    await startBatchCategorization(allSites, simpleCategories);
                                }}
                                onAIIcon={() => {
                                    const cleanCategories = categories.map(c => ({ id: c.id, name: c.name }));
                                    startBatchIconGeneration(cleanCategories);
                                }}
                                onAIDiscover={() => setIsAIDiscoveryOpen(true)}
                                isBatchAnalyzing={isBatchAnalyzing}
                                batchProgress={batchProgress}
                                onClearEmpty={() => setIsClearConfirmOpen(true)}
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                aiConfigured={aiConfigured}
                                onSortChange={(newSortBy, newSortOrder) => {
                                    setSortBy(newSortBy);
                                    setSortOrder(newSortOrder);
                                }}
                            />
                        )}

                        <div className="space-y-6">
                            {categories.map((category, index) => (
                                <section
                                    key={category.id}
                                    id={category.id}
                                    className="scroll-mt-4" // Reduced scroll margin needed
                                >
                                    <CategoryTitle
                                        user={readOnly ? undefined : user}
                                        category={{
                                            ...category,
                                            _count: { sites: category.sites.length }
                                        }}
                                        categories={categories.map(c => ({ id: c.id, name: c.name }))}
                                        panels={panels.map(p => ({ id: p.id, name: p.name }))}
                                        currentPanelId={panelId}
                                        onEditComplete={async (id, data) => {
                                            try {
                                                await updateCategory(id, data);
                                                // 如果 panelId 变化了，说明分类被移到了其他版块，移除当前视图中的分类
                                                if (data.panelId && data.panelId !== panelId) {
                                                    setCategories(prev => prev.filter(c => c.id !== id));
                                                    showToast('分类已移动到其他收藏夹', 'success');
                                                    return;
                                                }
                                                // 局部更新状态，避免 window.location.reload() 导致的页面跳动和闪烁
                                                setCategories(prev => prev.map(cat =>
                                                    cat.id === id ? { ...cat, ...data } : cat
                                                ));
                                            } catch (error) {
                                                console.error('Failed to update category:', error);
                                            }
                                        }}
                                        onAddSiteComplete={(newSite) => {
                                            // 局部添加并排序
                                            setCategories(prev => prev.map(cat => {
                                                if (cat.id === newSite.categoryId) {
                                                    const newSites = [...cat.sites, newSite].sort((a, b) => {
                                                        return (b.visits || 0) - (a.visits || 0);
                                                    });
                                                    return { ...cat, sites: newSites };
                                                }
                                                return cat;
                                            }));
                                        }}
                                        onDeleteCategory={async (id) => {
                                            try {
                                                const response = await fetch(`/api/categories/${id}`, {
                                                    method: 'DELETE',
                                                });

                                                if (!response.ok) throw new Error('Failed to delete category');

                                                setCategories(prev => prev.filter(cat => cat.id !== id));
                                            } catch (error) {
                                                console.error('Failed to delete category:', error);
                                                showToast('删除分类失败', 'error');
                                            }
                                        }}
                                    />

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6 min-[2200px]:grid-cols-7 min-[2600px]:grid-cols-8 min-[3000px]:grid-cols-9 min-[3400px]:grid-cols-10 gap-4">
                                        {[...category.sites]
                                            .sort((a, b) => {
                                                // 1. 优先按 isPinned 排序 (true 在前)
                                                if (a.isPinned !== b.isPinned) {
                                                    return a.isPinned ? -1 : 1;
                                                }

                                                // 2. 二级排序：按用户选定的规则
                                                if (sortBy === 'name') {
                                                    const comparison = a.title.localeCompare(b.title, 'zh-CN');
                                                    return sortOrder === 'asc' ? comparison : -comparison;
                                                } else {
                                                    const aVisits = a.visits || 0;
                                                    const bVisits = b.visits || 0;
                                                    return sortOrder === 'asc' ? aVisits - bVisits : bVisits - aVisits;
                                                }
                                            })
                                            .map((site) => (
                                                <div key={site.id} id={`site-${site.id}`}>
                                                    <SiteCard
                                                        user={readOnly ? undefined : user}
                                                        site={site}
                                                        onUpdate={(updatedSite) => {
                                                            // 局部更新网页状态并重排序
                                                            setCategories(prev => {
                                                                let newCategories = [...prev];
                                                                const oldCategory = prev.find(cat => cat.sites.some(s => s.id === updatedSite.id));

                                                                if (oldCategory && oldCategory.id !== updatedSite.categoryId) {
                                                                    // 分类改变了
                                                                    newCategories = prev.map(cat => {
                                                                        if (cat.id === oldCategory.id) {
                                                                            return { ...cat, sites: cat.sites.filter(s => s.id !== updatedSite.id) };
                                                                        }
                                                                        if (cat.id === updatedSite.categoryId) {
                                                                            return { ...cat, sites: [...cat.sites, updatedSite] };
                                                                        }
                                                                        return cat;
                                                                    });
                                                                } else {
                                                                    // 分类没变
                                                                    newCategories = prev.map(cat => ({
                                                                        ...cat,
                                                                        sites: cat.sites.map(s => s.id === updatedSite.id ? { ...s, ...updatedSite } : s)
                                                                    }));
                                                                }

                                                                // 保持与主渲染一致的排序逻辑
                                                                return newCategories.map(cat => ({
                                                                    ...cat,
                                                                    sites: [...cat.sites].sort((a, b) => {
                                                                        if (a.isPinned !== b.isPinned) {
                                                                            return a.isPinned ? -1 : 1;
                                                                        }
                                                                        if (sortBy === 'name') {
                                                                            const comparison = a.title.localeCompare(b.title, 'zh-CN');
                                                                            return sortOrder === 'asc' ? comparison : -comparison;
                                                                        } else {
                                                                            const aVisits = a.visits || 0;
                                                                            const bVisits = b.visits || 0;
                                                                            return sortOrder === 'asc' ? aVisits - bVisits : bVisits - aVisits;
                                                                        }
                                                                    })
                                                                }));
                                                            });
                                                        }}
                                                        categories={categories.map(c => ({ id: c.id, name: c.name }))}
                                                        onDelete={(id) => {
                                                            // 局部从状态中移除网页
                                                            setCategories(prev => prev.map(cat => ({
                                                                ...cat,
                                                                sites: cat.sites.filter(s => s.id !== id)
                                                            })));
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                    </div>
                                </section>
                            ))}
                        </div>


                    </div>
                </main>
            </div>

            <BackToTop />

            {/* 新建分类弹窗 */}
            <CategoryEditModal
                category={null}
                isOpen={isCreatingCategory}
                isCreate={true}
                onClose={() => setIsCreatingCategory(false)}
                onSave={async (id, data) => {
                    try {
                        const response = await fetch('/api/categories', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...data, panelId }),
                        });

                        if (!response.ok) throw new Error('Failed to create category');

                        const newCategory = await response.json();
                        setCategories(prev => [...prev, { ...newCategory, sites: [] }]);
                        setIsCreatingCategory(false);

                        // 延迟滚动到新分类并高亮
                        setTimeout(() => {
                            const container = document.getElementById('main-scroll-container');
                            const element = document.getElementById(newCategory.id);
                            const titleElement = document.getElementById(`title-${newCategory.id}`);

                            if (container && element) {
                                const offset = 100;
                                const elementTop = element.getBoundingClientRect().top;
                                const containerTop = container.getBoundingClientRect().top;
                                const offsetPosition = elementTop - containerTop + container.scrollTop - offset;

                                container.scrollTo({
                                    top: offsetPosition,
                                    behavior: "smooth"
                                });

                                // 添加高亮效果到标题行
                                if (titleElement) {
                                    titleElement.classList.add('search-highlight');
                                    setTimeout(() => titleElement.classList.remove('search-highlight'), 2000);
                                }
                            }
                        }, 100);
                    } catch (error) {
                        console.error('Failed to create category:', error);
                        showToast('创建分类失败', 'error');
                    }
                }}
            />
            {/* 导入书签弹窗 */}
            <ImportModal
                isOpen={isImporting}
                onClose={() => setIsImporting(false)}
                panelId={panelId}
                onSuccess={() => window.location.reload()}
            />
            {/* 添加网页弹窗 */}
            <SiteEditModal
                isOpen={isAddingSite}
                categories={categories.map(c => ({ id: c.id, name: c.name }))}
                onClose={() => setIsAddingSite(false)}
                onSave={async (id, data) => {
                    try {
                        const response = await fetch('/api/sites', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data),
                        });
                        if (!response.ok) throw new Error('Failed to create site');
                        const newSite = await response.json();
                        // 刷新页面以显示新书签
                        window.location.reload();
                    } catch (error) {
                        console.error('Failed to add site:', error);
                        showToast('添加网页失败', 'error');
                    }
                }}
            />

            <ConfirmModal
                isOpen={isClearConfirmOpen}
                onClose={() => setIsClearConfirmOpen(false)}
                onConfirm={handleConfirmClearEmpty}
                title="清理空分类"
                message="确定要删除当前版块下所有没有网页的空分类吗？此操作无法撤销。"
                confirmText="清理"
                cancelText="取消"
                type="warning"
            />

            {/* 侧边栏双击编辑分类弹窗 */}
            {editingCategory && (
                <CategoryEditModal
                    category={{
                        ...editingCategory,
                        _count: { sites: editingCategory.sites.length }
                    }}
                    isOpen={!!editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onSave={async (id, data) => {
                        try {
                            await updateCategory(id, data);
                            if (data.panelId && data.panelId !== panelId) {
                                setCategories(prev => prev.filter(c => c.id !== id));
                                showToast('分类已移动到其他收藏夹', 'success');
                            } else {
                                setCategories(prev => prev.map(cat =>
                                    cat.id === id ? { ...cat, ...data } : cat
                                ));
                            }
                            setEditingCategory(null);
                        } catch (error) {
                            console.error('Failed to update category:', error);
                        }
                    }}
                    onDelete={async (id) => {
                        try {
                            const response = await fetch(`/api/categories/${id}`, {
                                method: 'DELETE',
                            });
                            if (!response.ok) throw new Error('Failed to delete category');
                            setCategories(prev => prev.filter(cat => cat.id !== id));
                            setEditingCategory(null);
                        } catch (error) {
                            console.error('Failed to delete category:', error);
                            showToast('删除分类失败', 'error');
                        }
                    }}
                    panels={panels.map(p => ({ id: p.id, name: p.name }))}
                    currentPanelId={panelId}
                />
            )}

            {readOnly && owner && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
                    <div className="flex items-center gap-3 pl-4 pr-2 py-2 bg-white/80 dark:bg-black/80 backdrop-blur-md border border-[var(--color-border)] rounded-full shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span style={{ color: 'var(--color-text-secondary)' }}>来自</span>
                            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                                {owner.name || '用户'}
                            </span>
                            <span style={{ color: 'var(--color-text-secondary)' }}>的收藏夹</span>
                        </div>
                        <button
                            onClick={(e) => {
                                const target = e.currentTarget.parentElement?.parentElement;
                                if (target) {
                                    target.style.opacity = '0';
                                    target.style.pointerEvents = 'none';
                                }
                            }}
                            className="p-1.5 hover:bg-[var(--color-bg-secondary)] rounded-full transition-colors ml-1"
                        >
                            <X size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                        </button>
                    </div>
                </div>
            )}


            {/* AI 发现弹窗 */}
            <AIDiscoveryModal
                isOpen={isAIDiscoveryOpen}
                onClose={() => setIsAIDiscoveryOpen(false)}
                categories={categories.map(c => ({ id: c.id, name: c.name }))}
                onAddSites={handleAIDiscoverAddSites}
            />

            {/* AI 任务执行状态指示器 */}
            <AITaskIndicator />
        </DndProvider>
    );
}
