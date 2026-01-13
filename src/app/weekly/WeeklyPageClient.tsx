'use client';

import { Suspense, useState } from 'react';
import TopNav from '@/components/TopNav';
import WeeklySidebar from '@/components/WeeklySidebar';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

interface WeeklyPost {
    slug: string;
    title: string;
    date: string;
    category: string;
    tags: string[];
    excerpt: string;
    cover?: string | null;
    views?: number;
    readingTime?: number;
}

interface WeeklyPageClientProps {
    posts: WeeklyPost[];
    viewsMap: Record<string, number>;
}

export default function WeeklyPageClient({ posts, viewsMap }: WeeklyPageClientProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // 合并浏览量数据
    const postsWithViews = posts.map(post => ({
        ...post,
        views: viewsMap[post.slug] || 0
    }));

    // 按分类分组
    const postsByCategory = postsWithViews.reduce((acc, post) => {
        if (!acc[post.category]) {
            acc[post.category] = [];
        }
        acc[post.category].push(post);
        return acc;
    }, {} as Record<string, WeeklyPost[]>);

    const categories = Object.keys(postsByCategory).map(name => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        count: postsByCategory[name].length
    }));

    // 热门文章(按浏览量排序,取前5篇)
    const trendingPosts = [...postsWithViews]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5);

    return (
        <>
            <TopNav
                sidebarCollapsed={sidebarCollapsed}
                searchResults={posts.map(post => ({
                    id: post.slug,
                    title: post.title,
                    description: post.excerpt,
                    url: `/weekly/${post.slug}`,
                    categoryId: post.category.toLowerCase(),
                    categoryName: post.category
                }))}
            />

            {/* 左侧边栏 */}
            <WeeklySidebar
                categories={categories}
                defaultActiveId={categories.length > 0 ? categories[0].id : ''}
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* 主内容区 - Medium 风格三栏布局 */}
            <div className={`min-h-screen pt-24 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64'
                }`} style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* 中间主内容区 */}
                        <main className="lg:col-span-8">
                            <h1 className="text-4xl font-bold mb-8" style={{ color: 'var(--color-text-primary)' }}>
                                周刊
                            </h1>

                            {categories.map(category => {
                                const categoryPosts = postsByCategory[category.name];
                                return (
                                    <section key={category.id} id={category.id} className="mb-12 scroll-mt-24">
                                        <h2 className="text-2xl font-bold mb-6 pb-3" style={{
                                            color: 'var(--color-text-primary)',
                                            borderBottom: '1px solid var(--color-border)'
                                        }}>
                                            {category.name}
                                        </h2>

                                        <div className="space-y-8">
                                            {categoryPosts.map((post, index) => (
                                                <article key={post.slug} className="group">
                                                    <Link href={`/weekly/${post.slug}`}>
                                                        <div className="flex gap-6">
                                                            {/* 文章信息 */}
                                                            <div className="flex-1">
                                                                <h3 className="text-xl font-bold mb-2 group-hover:underline" style={{ color: 'var(--color-text-primary)' }}>
                                                                    {post.title}
                                                                </h3>

                                                                <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                                                                    {post.excerpt}
                                                                </p>

                                                                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                                                                    <time>
                                                                        {new Date(post.date).toLocaleDateString('zh-CN', {
                                                                            year: 'numeric',
                                                                            month: 'short',
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
                                                                    <span>{post.views} 次阅读</span>
                                                                    {post.tags && post.tags.length > 0 && (
                                                                        <>
                                                                            <span>·</span>
                                                                            <div className="flex gap-2">
                                                                                {post.tags.slice(0, 2).map(tag => (
                                                                                    <span
                                                                                        key={tag}
                                                                                        className="px-2 py-0.5 rounded text-xs"
                                                                                        style={{
                                                                                            backgroundColor: 'var(--color-bg-tertiary)',
                                                                                            color: 'var(--color-text-secondary)'
                                                                                        }}
                                                                                    >
                                                                                        {tag}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* 封面图 */}
                                                            {post.cover && (
                                                                <div className="w-40 h-28 flex-shrink-0 rounded-lg overflow-hidden">
                                                                    <img
                                                                        src={post.cover}
                                                                        alt={post.title}
                                                                        className="w-full h-full object-cover"
                                                                        style={{
                                                                            border: '1px solid var(--color-border)'
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Link>

                                                    {/* 分隔线 */}
                                                    <div className="mt-8 pt-0" style={{ borderTop: '1px solid var(--color-border)' }} />
                                                </article>
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}

                            {posts.length === 0 && (
                                <div className="text-center py-12">
                                    <p style={{ color: 'var(--color-text-secondary)' }}>
                                        暂无周刊内容
                                    </p>
                                </div>
                            )}
                        </main>

                        {/* 右侧热门推荐栏 */}
                        <aside className="hidden lg:block lg:col-span-4">
                            <div className="sticky top-24">
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingUp size={20} style={{ color: 'var(--color-accent)' }} />
                                        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                            热门文章
                                        </h3>
                                    </div>

                                    <div className="space-y-6">
                                        {trendingPosts.map((post, index) => (
                                            <Link
                                                key={post.slug}
                                                href={`/weekly/${post.slug}`}
                                                className="block group"
                                            >
                                                <div className="flex gap-3">
                                                    <span
                                                        className="text-2xl font-bold flex-shrink-0"
                                                        style={{ color: 'var(--color-text-tertiary)' }}
                                                    >
                                                        {String(index + 1).padStart(2, '0')}
                                                    </span>

                                                    <div className="flex-1">
                                                        <h4 className="font-semibold mb-1 line-clamp-2 group-hover:underline" style={{ color: 'var(--color-text-primary)' }}>
                                                            {post.title}
                                                        </h4>

                                                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                                                            <time>
                                                                {new Date(post.date).toLocaleDateString('zh-CN', {
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })}
                                                            </time>
                                                            <span>·</span>
                                                            <span>{post.views} 阅读</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* 推荐标签 */}
                                <div className="mt-8 pt-8" style={{ borderTop: '1px solid var(--color-border)' }}>
                                    <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                                        推荐标签
                                    </h3>

                                    <div className="flex flex-wrap gap-2">
                                        {Array.from(new Set(posts.flatMap(p => p.tags || []))).slice(0, 10).map(tag => (
                                            <span
                                                key={tag}
                                                className="px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors hover:bg-[var(--color-accent-soft)]"
                                                style={{
                                                    backgroundColor: 'var(--color-bg-secondary)',
                                                    color: 'var(--color-text-secondary)',
                                                    border: '1px solid var(--color-border)'
                                                }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </>
    );
}
