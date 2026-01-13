'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { Construction } from 'lucide-react';

export default function MyNavPage() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeCategory, setActiveCategory] = useState('');

    return (
        <div className="flex min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
            <Sidebar
                categories={[]}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex"
            />

            <div className="flex-1 flex flex-col min-w-0">
                <TopNav />

                <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-[var(--color-bg-secondary)] p-12 rounded-2xl border border-[var(--color-border)] max-w-lg w-full">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                            <Construction className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold mb-3">我的导航</h1>
                        <p className="text-[var(--color-text-secondary)]">
                            此功能正在开发中，敬请期待...
                        </p>
                        <div className="mt-8 text-sm text-[var(--color-text-tertiary)]">
                            登录后即可管理您的专属导航站
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
