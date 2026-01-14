'use client';

import { useState } from 'react';
import WeeklySidebar from '@/components/WeeklySidebar';
import TopNav from '@/components/TopNav';

interface Category {
    id: string;
    name: string;
    count?: number;
}

export default function WeeklyDetailLayout({
    categories,
    defaultActiveId,
    children
}: {
    categories: Category[];
    defaultActiveId: string;
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] overflow-hidden">
            <WeeklySidebar
                categories={categories}
                defaultActiveId={defaultActiveId}
                isCollapsed={isCollapsed}
                onToggle={() => setIsCollapsed(!isCollapsed)}
            />

            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? 'md:ml-[72px]' : 'md:ml-64'}`}>
                <TopNav sidebarCollapsed={isCollapsed} />

                <div className="pt-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <main className="lg:col-span-8 py-8 lg:px-16 w-full">
                                {children}
                            </main>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
