'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav, { SearchResult } from '@/components/TopNav';
import SiteCard from '@/components/SiteCard';
import CategoryTitle from './CategoryTitle';
import DndProvider from './DndProvider';
import { Category, Site } from '@prisma/client';
import { Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { updateCategory } from '@/lib/category-api';
import { CategoryEditModal } from './CategoryEditModal';
import PageToolbar, { SortBy, SortOrder } from './PageToolbar';
import ImportModal from './ImportModal';

type CategoryWithSites = Category & { sites: Site[] };

export default function ClientWrapper({ initialCategories, panelId, panels }: { initialCategories: CategoryWithSites[], panelId: string, panels: any[] }) {
    const [categories, setCategories] = useState(initialCategories);
    const initialId = categories.length > 0 ? categories[0].id : '';
    const [activeCategory, setActiveCategory] = useState(initialId);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeNav, setActiveNav] = useState('tools');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [sortBy, setSortBy] = useState<SortBy>('visits');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
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
    };

    // 拍平所有站点数据用于搜索
    const searchableSites: SearchResult[] = categories.flatMap(cat =>
        cat.sites.map(site => ({
            id: site.id,
            title: site.title,
            description: site.description,
            url: site.url,
            categoryId: cat.id,
            categoryName: cat.name
        }))
    );

    const scrollToSite = (siteId: string, categoryId: string) => {
        // 首先切换到对应的分类（更新侧边栏激活状态）
        handleCategoryChange(categoryId);

        // 延迟滚动，确保分类已经渲染或展示
        setTimeout(() => {
            const element = document.getElementById(`site-${siteId}`);
            if (element) {
                const offset = 100;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });

                // 增加一个短暂的高亮效果
                element.classList.add('search-highlight');
                setTimeout(() => element.classList.remove('search-highlight'), 2000);
            } else {
                // 如果找不到具体的站点元素（可能在尚未渲染的分类中），就滚到分类
                document.getElementById(categoryId)?.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    const handleSearchResultSelect = (result: SearchResult) => {
        scrollToSite(result.id, result.categoryId);
    };

    const handleSearchResultFocus = (result: SearchResult) => {
        scrollToSite(result.id, result.categoryId);
    };

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
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                onCategoriesReorder={(reorderedCategories) => {
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
                    Navix
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
                    className="fixed inset-0 z-40 pt-16 md:hidden"
                    style={{ backgroundColor: 'var(--sidebar-bg)' }}
                >
                    <div className="p-4 space-y-2">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setActiveCategory(cat.id);
                                    setMobileMenuOpen(false);
                                    document.getElementById(cat.id)?.scrollIntoView();
                                }}
                                className="block w-full text-left px-4 py-3 rounded-lg font-medium transition-colors"
                                style={{
                                    color: 'var(--color-text-primary)',
                                    backgroundColor: activeCategory === cat.id ? 'var(--color-accent-soft)' : 'transparent'
                                }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Content Wrapper - Handles offset and flow */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64'}`}>
                {/* Top Navigation (Desktop) - Sticky inside content wrapper */}
                <TopNav
                    sidebarCollapsed={sidebarCollapsed}
                    searchResults={searchableSites}
                    onResultSelect={handleSearchResultSelect}
                    onResultFocus={handleSearchResultFocus}
                    panels={panels}
                />

                {/* Main Content Area */}
                <main
                    className="min-h-screen"
                    style={{ backgroundColor: 'var(--color-bg-primary)' }}
                >
                    {/* Add padding for TopNav on desktop, for mobile header on mobile */}
                    <div className="max-w-full mx-auto px-4 sm:px-10 pt-20 md:pt-20 pb-8 space-y-6 min-h-screen">
                        {/* 页面工具栏 */}
                        <PageToolbar
                            onAddCategory={() => setIsCreatingCategory(true)}
                            onImport={() => setIsImporting(true)}
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            onSortChange={(newSortBy, newSortOrder) => {
                                setSortBy(newSortBy);
                                setSortOrder(newSortOrder);
                            }}
                        />

                        <div className="space-y-6">
                            {categories.map((category, index) => (
                                <section
                                    key={category.id}
                                    id={category.id}
                                    className="scroll-mt-24"
                                >
                                    <CategoryTitle
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
                                                // 如果 panelId 变化了，说明分类被移到了其他版块，需要刷新页面
                                                if (data.panelId && data.panelId !== panelId) {
                                                    window.location.reload();
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
                                                alert('删除分类失败');
                                            }
                                        }}
                                    />

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6 min-[2200px]:grid-cols-7 min-[2600px]:grid-cols-8 min-[3000px]:grid-cols-9 min-[3400px]:grid-cols-10 gap-4">
                                        {[...category.sites]
                                            .sort((a, b) => {
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
                                                        site={site}
                                                        onUpdate={(updatedSite) => {
                                                            // 局部更新站点状态并重排序
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

                                                                // 仅按点击量重新排序站点
                                                                return newCategories.map(cat => ({
                                                                    ...cat,
                                                                    sites: [...cat.sites].sort((a, b) => (b.visits || 0) - (a.visits || 0))
                                                                }));
                                                            });
                                                        }}
                                                        categories={categories.map(c => ({ id: c.id, name: c.name }))}
                                                        onDelete={(id) => {
                                                            // 局部从状态中移除站点
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

                        <footer
                            className="mt-20 pt-8 pb-8 text-center text-xs"
                            style={{
                                borderTop: '1px solid var(--color-border)',
                                color: 'var(--color-text-tertiary)'
                            }}
                        >
                            <p>© {new Date().getFullYear()} Navix. Designed with layered shadows & dark mode.</p>
                        </footer>
                    </div>
                </main>
            </div>

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
                            const element = document.getElementById(newCategory.id);
                            if (element) {
                                const offset = 100;
                                const elementPosition = element.getBoundingClientRect().top;
                                const offsetPosition = elementPosition + window.pageYOffset - offset;
                                window.scrollTo({
                                    top: offsetPosition,
                                    behavior: "smooth"
                                });

                                // 添加高亮效果
                                element.classList.add('search-highlight');
                                setTimeout(() => element.classList.remove('search-highlight'), 2000);
                            }
                        }, 100);
                    } catch (error) {
                        console.error('Failed to create category:', error);
                        alert('创建分类失败');
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
        </DndProvider>
    );
}
