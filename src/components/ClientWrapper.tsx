'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import SiteCard from '@/components/SiteCard';
import { Category, Site } from '@prisma/client';
import { Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

type CategoryWithSites = Category & { sites: Site[] };

export default function ClientWrapper({ categories }: { categories: CategoryWithSites[] }) {
    const initialId = categories.length > 0 ? categories[0].id : '';
    const [activeCategory, setActiveCategory] = useState(initialId);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (categories.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
                        setActiveCategory(entry.target.id);
                    }
                });
            },
            { rootMargin: '-10% 0px -60% 0px', threshold: 0.1 }
        );

        categories.forEach((cat) => {
            const element = document.getElementById(cat.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [categories]);

    return (
        <>
            {/* Sidebar (Desktop) - Fixed position, not in flex flow */}
            <Sidebar
                categories={categories.map(c => ({ id: c.id, name: c.name }))}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
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
                className="md:ml-64 min-h-screen transition-colors duration-300"
                style={{ backgroundColor: 'var(--color-bg-primary)' }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 md:py-12 space-y-12 min-h-screen">

                    {/* Hero / Header */}
                    <div className="mb-8 pt-12 md:pt-0">
                        <h1
                            className="text-2xl font-bold"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            Welcome Back
                        </h1>
                        <p
                            className="text-sm mt-1"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            Explore your curated collection of tools.
                        </p>
                    </div>

                    <div className="space-y-12">
                        {categories.map((category) => (
                            <section
                                key={category.id}
                                id={category.id}
                                className="scroll-mt-8"
                            >
                                <div className="flex items-center gap-3 mb-5">
                                    <h2
                                        className="text-lg font-bold"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        {category.name}
                                    </h2>
                                    <span
                                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                                        style={{
                                            backgroundColor: 'var(--color-bg-tertiary)',
                                            color: 'var(--color-text-tertiary)',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    >
                                        {category.sites.length}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {category.sites.map((site) => (
                                        <SiteCard key={site.id} site={site} />
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
        </>
    );
}
