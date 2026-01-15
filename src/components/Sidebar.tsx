'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
    icons,
    Terminal,
    Palette,
    Layout,
    Zap,
    BookOpen,
    Image as ImageIcon,
    Monitor,
    ChevronLeft,
    ChevronRight,
    Wrench
} from 'lucide-react';
import { DraggableSidebarItem } from './DraggableSidebarItem';
import { useToast } from './Toast';

// Map distinct icons to known categories for a better look
const iconMap: Record<string, any> = {
    'efficiency': Zap,
    'productivity': Zap,
    '效率': Zap,
    'design': Palette,
    '设计': Palette,
    'dev': Terminal,
    '开发': Terminal,
    'development': Terminal,
    'read': BookOpen,
    'tools': Wrench,
    '工具': Wrench,
    'assets': ImageIcon,
    'ui': Layout,
    'other': Monitor
};

type Category = {
    id: string;
    name: string;
    icon?: string | null;
};

// 统一的菜单项高度
const MENU_ITEM_HEIGHT = 44; // px

export default function Sidebar({
    categories: externalCategories,
    activeCategory,
    onCategoryChange,
    isCollapsed,
    onToggle,
    onCategoriesReorder,
    className = "",
    user // Add user prop
}: {
    categories: Category[],
    activeCategory: string,
    onCategoryChange: (id: string) => void,
    isCollapsed: boolean,
    onToggle: () => void,
    onCategoriesReorder?: (categories: Category[]) => void,
    className?: string,
    user?: any // Add user prop type
}) {
    const { showToast } = useToast();
    const [categories, setCategories] = useState(externalCategories);
    const [isSaving, setIsSaving] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasChangesRef = useRef(false);
    const categoriesRef = useRef(categories);

    // 同步 ref 和外部传入的 categories
    useEffect(() => {
        // 只有在没有本地悬而未决的变化时，或者正在保存成功后，才从外部同步数据
        if (!hasChangesRef.current && !isSaving) {
            setCategories(externalCategories);
            categoriesRef.current = externalCategories;
        }
    }, [externalCategories, isSaving]);

    // 同步 categories 状态到 ref
    useEffect(() => {
        categoriesRef.current = categories;
    }, [categories]);

    const scrollToCategory = (id: string) => {
        onCategoryChange(id);
        const element = document.getElementById(id);
        if (element) {
            const offset = 100; // 增加 offset 以适应顶部导航栏
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    const handleDragEnd = useCallback((id: string) => {
        const currentCategories = categoriesRef.current;

        // 1. 立即通知父组件更新布局，这样右侧的内容顺序会变
        if (onCategoriesReorder) {
            onCategoriesReorder(currentCategories);
        }

        // 2. 标记为该分类活跃，并在微小的延迟后滚动，确保 DOM 已经更新
        onCategoryChange(id);
        setTimeout(() => {
            const element = document.getElementById(id);
            if (element) {
                const offset = 100;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        }, 50); // 给 React 一个渲染的时间
    }, [onCategoriesReorder, onCategoryChange]);

    const saveCategoryOrder = useCallback(async () => {
        if (!hasChangesRef.current) return;

        setIsSaving(true);
        try {
            // 使用 ref 获取最新的 categories
            const currentCategories = categoriesRef.current;
            const categoryOrders = currentCategories.map((cat, index) => ({
                id: cat.id,
                sortOrder: index
            }));

            const response = await fetch('/api/categories/reorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ categoryOrders }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '保存失败');
            }

            hasChangesRef.current = false;
        } catch (error) {
            console.error('保存分类顺序失败:', error);
            showToast(`保存分类顺序失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
        } finally {
            setIsSaving(false);
        }
    }, []); // 减少依赖，让它更稳定

    const moveCategory = useCallback((dragIndex: number, hoverIndex: number) => {
        setCategories((prevCategories) => {
            const newCategories = [...prevCategories];
            const dragCategory = newCategories[dragIndex];
            newCategories.splice(dragIndex, 1);
            newCategories.splice(hoverIndex, 0, dragCategory);

            // 更新 ref
            categoriesRef.current = newCategories;

            // 标记有变化
            hasChangesRef.current = true;

            // 清除之前的定时器
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            // 设置新的定时器，1秒后保存
            saveTimeoutRef.current = setTimeout(() => {
                saveCategoryOrder();
            }, 1000);

            return newCategories;
        });
    }, [saveCategoryOrder]);

    return (
        <aside
            className={`h-screen fixed left-0 top-0 flex flex-col z-40 hidden md:flex transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[72px]' : 'w-64'} ${className}`}
            style={{
                backgroundColor: 'var(--sidebar-bg)',
                borderRight: '1px solid var(--sidebar-border)'
            }}
        >
            {/* Logo Area */}
            <div
                className="h-16 flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{ borderBottom: '1px solid var(--sidebar-border)' }}
            >
                <div className={`flex items-center ${isCollapsed ? '' : 'gap-3 px-6 w-full'}`}>
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
                        <div className={`flex flex-col ml-3 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 flex-1'}`}>
                            <span
                                className="font-bold text-lg leading-tight"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                Nivix 灵犀导航
                            </span>
                            <span
                                className="text-xs leading-tight mt-0.5 truncate max-w-[160px]"
                                style={{ color: 'var(--color-text-secondary)' }}
                                title="AI 驱动的智能书签，懂收藏，更懂整理。"
                            >
                                AI 驱动的智能书签
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className={`flex-1 overflow-y-auto py-4 space-y-1 ${isCollapsed ? 'px-3' : 'px-3'}`}>
                {!isCollapsed && (
                    <div
                        className="text-xs font-semibold px-3 mb-3 uppercase tracking-wider"
                        style={{ color: 'var(--color-text-tertiary)' }}
                    >
                        分类导航 {isSaving && <span className="text-xs">(保存中...)</span>}
                    </div>
                )}

                {categories.map((cat, index) => {
                    let IconComponent = Monitor;

                    // 优先使用数据库中的图标
                    if (cat.icon) {
                        const effectiveIcon = cat.icon === 'Home' ? 'House' : cat.icon;
                        IconComponent = icons[effectiveIcon as keyof typeof icons] || Monitor;
                    } else {
                        // 如果没有图标，使用映射规则
                        const lowerName = cat.name.toLowerCase();
                        const lowerId = cat.id.toLowerCase();

                        for (const key in iconMap) {
                            if (lowerId.includes(key) || lowerName.includes(key)) {
                                IconComponent = iconMap[key];
                                break;
                            }
                        }
                    }

                    const isActive = activeCategory === cat.id;

                    return (
                        <DraggableSidebarItem
                            key={cat.id}
                            category={cat}
                            index={index}
                            isActive={isActive}
                            isCollapsed={isCollapsed}
                            IconComponent={IconComponent}
                            onMove={moveCategory}
                            onDragEnd={() => handleDragEnd(cat.id)}
                            onClick={() => scrollToCategory(cat.id)}
                            disabled={!user} // Disable drag if not authenticated
                        />
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
                        <ChevronRight className="w-5 h-5 flex-shrink-0" />
                    ) : (
                        <>
                            <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                            <span>收起菜单</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}
