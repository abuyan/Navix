'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function BackToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const container = document.getElementById('main-scroll-container') || window;

        const toggleVisibility = () => {
            const scrollTop = container === window ? window.pageYOffset : (container as HTMLElement).scrollTop;
            if (scrollTop > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        container.addEventListener('scroll', toggleVisibility);
        return () => container.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        const container = document.getElementById('main-scroll-container') || window;
        container.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={`fixed bottom-8 right-8 z-50 p-3 rounded-full shadow-lg transition-all duration-300 transform ${isVisible
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
                } hover:scale-110 active:scale-95 group overflow-hidden`}
            style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
            aria-label="返回顶部"
        >
            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <ChevronUp
                size={22}
                className="relative z-10 transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
            />
        </button>
    );
}
