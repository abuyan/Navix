'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';


const MENU_ITEM_HEIGHT = 44; // px

interface Category {
    id: string;
    name: string;
    count: number;
}

interface WeeklySidebarProps {
    categories: Category[];
    defaultActiveId: string;
    isCollapsed: boolean;
    onToggle: () => void;
}

export default function WeeklySidebar({ categories, defaultActiveId, isCollapsed, onToggle }: WeeklySidebarProps) {
    const [activeCategory, setActiveCategory] = useState(defaultActiveId);

    const handleCategoryClick = (categoryId: string) => {
        setActiveCategory(categoryId);
        // 平滑滚动到对应分类
        const element = document.getElementById(categoryId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <aside
            className={`fixed left-0 top-0 h-screen transition-all duration-300 z-40 flex flex-col ${isCollapsed ? 'w-[72px]' : 'w-64'
                } hidden md:flex`}
            style={{
                backgroundColor: 'var(--sidebar-bg)',
                borderRight: '1px solid var(--sidebar-border)'
            }}
        >
            {/* Logo 区域 */}
            <div
                className="h-14 flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{ borderBottom: '1px solid var(--sidebar-border)' }}
            >
                <Link href="/" className={`flex items-center ${isCollapsed ? '' : 'gap-3 px-6 w-full'}`}>
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 border transition-all duration-300"
                        style={{
                            background: '#000',
                            borderColor: 'rgba(255, 255, 255, 0.15)',
                            color: '#fff'
                        }}
                    >
                        N
                    </div>
                    {!isCollapsed && (
                        <span
                            className="text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            Navix
                        </span>
                    )}
                </Link>
            </div>



            {/* 分类列表 */}
            <nav className={`flex-1 overflow-y-auto py-4 space-y-1 ${isCollapsed ? 'px-3' : 'px-3'}`}>
                {!isCollapsed && (
                    <div
                        className="text-xs font-semibold px-3 mb-3 uppercase tracking-wider"
                        style={{ color: 'var(--color-text-tertiary)' }}
                    >
                        分类导航
                    </div>
                )}

                {categories.map((category) => {
                    const isActive = activeCategory === category.id;

                    return (
                        <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category.id)}
                            className={`w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200 group relative ${isCollapsed ? 'justify-center' : ''
                                }`}
                            style={{
                                height: `${MENU_ITEM_HEIGHT}px`,
                                padding: isCollapsed ? '0' : '0 12px',
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                gap: isCollapsed ? '0' : '12px',
                                backgroundColor: isActive ? 'var(--color-accent-soft)' : 'transparent',
                                color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)'
                            }}
                            title={isCollapsed ? category.name : undefined}
                        >
                            {/* 分类名称 */}
                            {!isCollapsed && (
                                <span className="flex-1 text-left font-medium text-sm truncate">
                                    {category.name}
                                </span>
                            )}

                            {/* 文章数量 */}
                            {!isCollapsed && (
                                <span
                                    className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                                    style={{
                                        backgroundColor: isActive
                                            ? 'var(--color-text-primary)'
                                            : 'var(--color-bg-tertiary)',
                                        color: isActive
                                            ? 'var(--color-bg-primary)'
                                            : 'var(--color-text-tertiary)'
                                    }}
                                >
                                    {category.count}
                                </span>
                            )}

                            {/* 折叠状态下的数字 */}
                            {isCollapsed && (
                                <span
                                    className="text-xs font-semibold"
                                    style={{
                                        color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)'
                                    }}
                                >
                                    {category.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Footer - Collapse Button */}
            <div
                className="p-3 flex-shrink-0"
                style={{ borderTop: '1px solid var(--sidebar-border)' }}
            >
                <button
                    onClick={onToggle}
                    title={isCollapsed ? '展开菜单' : '收起菜单'}
                    className="w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[var(--color-bg-tertiary)]"
                    style={{
                        height: `${MENU_ITEM_HEIGHT}px`,
                        padding: isCollapsed ? '0' : '0 12px',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: isCollapsed ? '0' : '12px',
                        color: 'var(--color-text-tertiary)'
                    }}
                >
                    {isCollapsed ? (
                        <ChevronRight size={18} />
                    ) : (
                        <>
                            <ChevronLeft size={18} />
                            <span>收起菜单</span>
                        </>
                    )}
                </button>
            </div>
        </aside >
    );
}
