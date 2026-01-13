import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { calculateReadingTime } from '@/lib/reading-time';

export interface WeeklyPost {
    slug: string;
    title: string;
    date: string;
    category: string;
    tags: string[];
    excerpt: string;
    content?: string;
    cover?: string | null;
    readingTime: number;
}

export async function GET() {
    try {
        const postsDirectory = path.join(process.cwd(), 'weekly/posts');

        // 递归读取所有年份目录下的 .md 文件
        const posts: WeeklyPost[] = [];

        const years = fs.readdirSync(postsDirectory);

        for (const year of years) {
            const yearPath = path.join(postsDirectory, year);
            const stat = fs.statSync(yearPath);

            if (stat.isDirectory()) {
                const files = fs.readdirSync(yearPath);

                for (const file of files) {
                    if (file.endsWith('.md')) {
                        const filePath = path.join(yearPath, file);
                        const fileContents = fs.readFileSync(filePath, 'utf8');
                        const { data } = matter(fileContents);

                        posts.push({
                            slug: `${year}/${file.replace(/\.md$/, '')}`,
                            title: data.title || 'Untitled',
                            date: data.date || '',
                            category: data.category || 'Uncategorized',
                            tags: data.tags || [],
                            excerpt: data.excerpt || '',
                            cover: data.cover || null,
                            readingTime: calculateReadingTime(fileContents) // Added readingTime calculation
                        });
                    }
                }
            }
        }

        // 按日期降序排序
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json(posts);
    } catch (error) {
        console.error('Error reading weekly posts:', error);
        return NextResponse.json({ error: 'Failed to read posts' }, { status: 500 });
    }
}
