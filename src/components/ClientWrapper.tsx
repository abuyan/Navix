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

type CategoryWithSites = Category & { sites: Site[] };

export default function ClientWrapper({ initialCategories }: { initialCategories: CategoryWithSites[] }) {
    const [categories, setCategories] = useState(initialCategories);
    const initialId = categories.length > 0 ? categories[0].id : '';
    const [activeCategory, setActiveCategory] = useState(initialId);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeNav, setActiveNav] = useState('tools');
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

            {/* Top Navigation (Desktop) - Fixed position, top */}
            <TopNav
                activeNav={activeNav}
                onNavChange={setActiveNav}
                sidebarCollapsed={sidebarCollapsed}
                searchResults={searchableSites}
                onResultSelect={handleSearchResultSelect}
                onResultFocus={handleSearchResultFocus}
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

            {/* Main Content Area */}
            <main
                className={`min-h-screen transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64'}`}
                style={{ backgroundColor: 'var(--color-bg-primary)' }}
            >
                {/* Add padding-top for TopNav on desktop, for mobile header on mobile */}
                <div className="max-w-full mx-auto px-4 sm:px-10 pt-16 md:pt-20 pb-8 space-y-6 min-h-screen">

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
                                    onEditComplete={async (id, data) => {
                                        try {
                                            await updateCategory(id, data);
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
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6 min-[2200px]:grid-cols-7 min-[2600px]:grid-cols-8 min-[3000px]:grid-cols-9 min-[3400px]:grid-cols-10 gap-4">
                                    {category.sites.map((site) => (
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
        </DndProvider>
    );
}
