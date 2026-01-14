'use client';

import { useState } from 'react';
import WeeklySidebar from '@/components/WeeklySidebar';

interface Category {
    id: string;
    name: string;
    count: number;
}

export default function WeeklySidebarWrapper({
    categories,
    defaultActiveId
}: {
    categories: any[],
    defaultActiveId: string
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <WeeklySidebar
            categories={categories}
            defaultActiveId={defaultActiveId}
            isCollapsed={isCollapsed}
            onToggle={() => setIsCollapsed(!isCollapsed)}
        />
    );
}
