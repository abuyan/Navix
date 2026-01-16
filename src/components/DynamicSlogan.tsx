'use client';

import { useState, useEffect } from 'react';

const slogans = [
    "心有灵犀，藏而有序",
    "灵犀一动，懂你所藏",
    "藏而不乱，查而即得"
];

export function DynamicSlogan() {
    const [index, setIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setIndex((prev) => (prev + 1) % slogans.length);
                setIsTransitioning(false);
            }, 500); // 渐隐动画时长
        }, 5000); // 切换周期

        return () => clearInterval(timer);
    }, []);

    return (
        <span
            className={`text-xs uppercase tracking-widest font-medium transition-all duration-500 block ${isTransitioning ? 'opacity-0 transform translate-y-1' : 'opacity-50 transform translate-y-0'}`}
            style={{ color: 'var(--color-text-secondary)' }}
        >
            {slogans[index]}
        </span>
    );
}
