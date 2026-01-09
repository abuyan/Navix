'use client';

import {
    Terminal,
    Palette,
    Layout,
    Settings,
    Zap,
    BookOpen,
    Image as ImageIcon,
    Monitor
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

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
    'tools': Settings,
    'assets': ImageIcon,
    'ui': Layout,
    'other': Monitor
};

type Category = {
    id: string;
    name: string;
};

export default function Sidebar({
    categories,
    activeCategory,
    onCategoryChange
}: {
    categories: Category[],
    activeCategory: string,
    onCategoryChange: (id: string) => void
}) {

    const scrollToCategory = (id: string) => {
        onCategoryChange(id);
        const element = document.getElementById(id);
        if (element) {
            const offset = 40;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    return (
        <aside
            className="w-64 h-screen fixed left-0 top-0 flex flex-col z-40 hidden md:flex transition-colors duration-300"
            style={{
                backgroundColor: 'var(--sidebar-bg)',
                borderRight: '1px solid var(--sidebar-border)'
            }}
        >
            {/* Logo Area */}
            <div
                className="p-6 flex items-center gap-3 transition-colors"
                style={{ borderBottom: '1px solid var(--sidebar-border)' }}
            >
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}
                >
                    N
                </div>
                <span
                    className="text-xl font-bold tracking-tight"
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    Navix
                </span>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                <div
                    className="text-xs font-semibold px-3 mb-3 uppercase tracking-wider"
                    style={{ color: 'var(--color-text-tertiary)' }}
                >
                    Categories
                </div>

                {categories.map((cat) => {
                    let IconComponent = Monitor;
                    const lowerName = cat.name.toLowerCase();
                    const lowerId = cat.id.toLowerCase();

                    for (const key in iconMap) {
                        if (lowerId.includes(key) || lowerName.includes(key)) {
                            IconComponent = iconMap[key];
                            break;
                        }
                    }

                    const isActive = activeCategory === cat.id;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => scrollToCategory(cat.id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group"
                            style={{
                                backgroundColor: isActive ? 'var(--color-accent-soft)' : 'transparent',
                                color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                                boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            <IconComponent
                                className="w-4 h-4 transition-colors"
                                style={{
                                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)'
                                }}
                            />
                            <span className="flex-1 text-left">{cat.name}</span>
                            {isActive && (
                                <div
                                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                                    style={{ backgroundColor: 'var(--color-accent)' }}
                                />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Footer with Theme Toggle */}
            <div
                className="p-4 flex items-center justify-between transition-colors"
                style={{ borderTop: '1px solid var(--sidebar-border)' }}
            >
                <button
                    className="flex items-center gap-3 px-3 py-2 text-sm transition-colors w-full rounded-lg"
                    style={{ color: 'var(--color-text-tertiary)' }}
                >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                </button>

                {/* Theme Toggle Button */}
                <ThemeToggle />
            </div>
        </aside>
    );
}
