'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DndProvider from '@/components/DndProvider';

interface Category {
    id: string;
    name: string;
    icon?: string | null;
}

export default function WeeklySidebarWrapper({
    categories,
    defaultActiveId
}: {
    categories: Category[],
    defaultActiveId: string
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeCategory, setActiveCategory] = useState(defaultActiveId);

    return (
        <DndProvider>
            <Sidebar
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                isCollapsed={isCollapsed}
                onToggle={() => setIsCollapsed(!isCollapsed)}
            // Removed className as Sidebar doesn't accept it in its props definition, 
            // but the original usage had it. Let's check Sidebar definition again.
            // Sidebar definition: export default function Sidebar({ ... })
            // It DOES NOT seem to accept className in props destructuring in previous `view_file`.
            // The wrapper handles the logic, Sidebar handles rendering. 
            // Wait, let me re-read Sidebar.tsx content from previous turn (Step 157).
            // Sidebar definition: export default function Sidebar({ categories, activeCategory, onCategoryChange, isCollapsed, onToggle, onCategoriesReorder }: ...)
            // It does NOT accept className. The previous usage `className="hidden md:flex"` was likely being ignored or passed but not used if it wasn't spread.
            // However, looking at Sidebar.tsx line 183: className={`h-screen ... hidden md:flex ...`} 
            // It has `hidden md:flex` hardcoded! So we don't need to pass it.
            />
        </DndProvider>
    );
}
