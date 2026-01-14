'use client';

import { useEffect, useState } from 'react';

interface Heading {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    content: string;
}

// 生成唯一的 slug ID
function slugify(text: string): string {
    return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\u4e00-\u9fa5a-z0-9-]/g, '')
        .replace(/-+/g, '-');
}

// 从 Markdown 内容中提取标题
function extractHeadings(markdown: string): Heading[] {
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const headings: Heading[] = [];
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = slugify(text);

        headings.push({ id, text, level });
    }

    return headings;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>('');
    const [headings, setHeadings] = useState<Heading[]>([]);

    // 提取标题
    useEffect(() => {
        const extractedHeadings = extractHeadings(content);
        setHeadings(extractedHeadings);
    }, [content]);

    // 监听滚动，高亮当前章节
    useEffect(() => {
        if (headings.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-80px 0px -80% 0px',
                threshold: 0
            }
        );

        // 观察所有标题元素
        headings.forEach(({ id }) => {
            const element = document.getElementById(id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            observer.disconnect();
        };
    }, [headings]);

    // 点击跳转
    const handleClick = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const top = element.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({
                top,
                behavior: 'smooth'
            });
        }
    };

    if (headings.length === 0) {
        return null;
    }

    return (
        <nav
            aria-label="目录导航"
            className="sticky top-24 hidden lg:block"
        >
            <div
                className="rounded-lg border p-4"
                style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)'
                }}
            >
                <h2
                    className="text-sm font-semibold mb-3 uppercase tracking-wide px-2"
                    style={{ color: 'var(--color-text-tertiary)' }}
                >
                    目录
                </h2>
                <ul className="space-y-2 text-sm">
                    {headings.map((heading) => (
                        <li
                            key={heading.id}
                            className={`${heading.level === 3 ? 'pl-4' : ''}`}
                        >
                            <button
                                onClick={() => handleClick(heading.id)}
                                className={`text-left w-full py-1 px-2 rounded transition-all toc-item ${activeId === heading.id
                                    ? 'font-semibold'
                                    : ''
                                    }`}
                                style={{
                                    color: activeId === heading.id
                                        ? 'var(--color-accent)'
                                        : 'var(--color-text-secondary)'
                                }}
                            >
                                {heading.text}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}
