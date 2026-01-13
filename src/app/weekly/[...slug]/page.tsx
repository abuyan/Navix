import { notFound } from 'next/navigation';
import WeeklyPostClient from './WeeklyPostClient';

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

async function getPost(slug: string[]): Promise<WeeklyPost | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/weekly/posts/${slug.join('/')}`, {
            cache: 'no-store'
        });

        if (!res.ok) {
            return null;
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching post:', error);
        return null;
    }
}

async function getViews(slug: string): Promise<number> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/weekly/views/${slug}`, {
            cache: 'no-store'
        });

        if (!res.ok) {
            return 0;
        }

        const data = await res.json();
        return data.views || 0;
    } catch (error) {
        console.error('Error fetching views:', error);
        return 0;
    }
}

async function getAllPosts(): Promise<WeeklyPost[]> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/weekly/posts`, {
            cache: 'no-store'
        });

        if (!res.ok) {
            return [];
        }

        const posts = await res.json();
        return posts;
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
}

export default async function WeeklyPostPage({ params }: { params: Promise<{ slug: string[] }> }) {
    const resolvedParams = await params;
    const slugStr = resolvedParams.slug.join('/');

    const [post, allPosts, views] = await Promise.all([
        getPost(resolvedParams.slug),
        getAllPosts(),
        getViews(slugStr)
    ]);

    if (!post) {
        notFound();
    }

    // 添加真实浏览量
    post.views = views;

    // 获取分类列表
    const postsByCategory = allPosts.reduce((acc, p) => {
        if (!acc[p.category]) {
            acc[p.category] = [];
        }
        acc[p.category].push(p);
        return acc;
    }, {} as Record<string, WeeklyPost[]>);

    const categories = Object.keys(postsByCategory).map(name => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        count: postsByCategory[name].length
    }));

    return <WeeklyPostClient post={post} categories={categories} slugStr={slugStr} allPosts={allPosts} />;
}
