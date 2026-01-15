'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    // Initial check for theme
    useEffect(() => {
        // Check if dark mode is actually active on mount
        const isDarkMode = document.documentElement.classList.contains('dark');
        setIsDark(isDarkMode);
    }, []);

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);

        if (newIsDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-lg transition-all duration-300 hover:bg-[var(--color-bg-tertiary)] hover:scale-105 active:scale-95"
            style={{
                color: 'var(--color-text-secondary)',
            }}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            suppressHydrationWarning
        >
            <Sun className="w-5 h-5 hidden dark:block" />
            <Moon className="w-5 h-5 block dark:hidden" />
        </button>
    );
}
