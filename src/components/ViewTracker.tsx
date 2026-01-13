'use client';

import { useEffect, useRef } from 'react';

interface ViewTrackerProps {
    slug: string;
}

export default function ViewTracker({ slug }: ViewTrackerProps) {
    const hasTracked = useRef(false);

    useEffect(() => {
        // 防止重复追踪(React Strict Mode 会导致组件渲染两次)
        if (hasTracked.current) {
            return;
        }

        // 页面加载时增加浏览量
        const incrementView = async () => {
            try {
                await fetch(`/api/weekly/views/${slug}`, {
                    method: 'POST'
                });
                hasTracked.current = true;
            } catch (error) {
                console.error('Failed to increment view:', error);
            }
        };

        // 使用 setTimeout 确保只执行一次
        const timer = setTimeout(() => {
            incrementView();
        }, 100);

        return () => clearTimeout(timer);
    }, [slug]);

    return null; // 这个组件不渲染任何内容
}
