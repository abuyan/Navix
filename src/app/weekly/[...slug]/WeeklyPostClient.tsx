'use client';

import { useState } from 'react';
import TopNav from '@/components/TopNav';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import WeeklySidebar from '@/components/WeeklySidebar';
import ViewTracker from '@/components/ViewTracker';
import TableOfContents from '@/components/TableOfContents';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface WeeklyPost {
    slug: string;
    title: string;
    date: string;
    category: string;
    tags: string[];
    excerpt: string;
    content: string;
    cover?: string | null;
    views?: number;
    readingTime?: number;
}

interface Category {
    id: string;
    name: string;
    count: number;
}

interface WeeklyPostClientProps {
    post: WeeklyPost;
    categories: Category[];
    slugStr: string;
    allPosts: WeeklyPost[];
    panels: any[];
}

export default function WeeklyPostClient({ post, categories, slugStr, allPosts, panels }: WeeklyPostClientProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <>
            <TopNav
                sidebarCollapsed={sidebarCollapsed}
                panels={panels}
                searchResults={allPosts.map(p => ({
                    id: p.slug,
                    title: p.title,
                    description: p.excerpt,
                    url: `/weekly/${p.slug}`,
                    categoryId: p.category.toLowerCase(),
                    categoryName: p.category
                }))}
            />

            {/* 浏览量追踪 */}
            <ViewTracker slug={slugStr} />

            {/* 左侧分类导航 */}
            <WeeklySidebar
                categories={categories}
                defaultActiveId={categories.length > 0 ? categories[0].id : ''}
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <main className={`min-h-screen pt-24 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64'
                }`} style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 py-8">
                    {/* 返回按钮 */}
                    <Link
                        href="/weekly"
                        className="inline-flex items-center gap-2 mb-8 text-sm transition-colors hover:underline"
                        style={{ color: 'var(--color-accent)' }}
                    >
                        <ArrowLeft size={16} />
                        返回周刊列表
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* 左侧：主内容区 */}
                        <div className="lg:col-span-9">
                            {/* 文章头部 */}
                            <header className="mb-8">
                                <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                                    {post.title}
                                </h1>

                                <div className="flex items-center gap-4 mb-4 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                                    <time>
                                        {new Date(post.date).toLocaleDateString('zh-CN', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </time>

                                    {post.readingTime && (
                                        <>
                                            <span>·</span>
                                            <span>{post.readingTime}分钟阅读</span>
                                        </>
                                    )}

                                    <span>·</span>

                                    <span>{post.category}</span>

                                    <span>·</span>

                                    <span>{post.views} 次阅读</span>
                                </div>

                                {post.tags && post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {post.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="px-3 py-1 text-sm rounded-full"
                                                style={{
                                                    backgroundColor: 'var(--color-accent-soft)',
                                                    color: 'var(--color-accent)'
                                                }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </header>

                            {/* 分割线 */}
                            <hr
                                className="mb-12 border-0 h-px"
                                style={{ backgroundColor: 'var(--color-border)' }}
                            />

                            {/* 文章内容 */}
                            <article className="mb-12">
                                <MarkdownRenderer content={post.content} />
                            </article>

                            {/* 底部导航 */}
                            <div className="pt-8" style={{ borderTop: '1px solid var(--color-border)' }}>
                                <Link
                                    href="/weekly"
                                    className="inline-flex items-center gap-2 text-sm transition-colors hover:underline"
                                    style={{ color: 'var(--color-accent)' }}
                                >
                                    <ArrowLeft size={16} />
                                    返回周刊列表
                                </Link>
                            </div>
                        </div>

                        {/* 右侧：目录导航 */}
                        <aside className="lg:col-span-3">
                            <TableOfContents content={post.content} />
                        </aside>
                    </div>
                </div>
            </main>
        </>
    );
}
