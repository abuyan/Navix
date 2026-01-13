import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { calculateReadingTime } from '@/lib/reading-time';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string[] }> }
) {
    try {
        const resolvedParams = await params;
        const slug = resolvedParams.slug.join('/');
        const filePath = path.join(process.cwd(), 'weekly/posts', `${slug}.md`);

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContents);

        return NextResponse.json({
            slug,
            title: data.title || 'Untitled',
            date: data.date || '',
            category: data.category || 'Uncategorized',
            tags: data.tags || [],
            excerpt: data.excerpt || '',
            cover: data.cover || null,
            content,
            readingTime: calculateReadingTime(fileContents)
        });
    } catch (error) {
        console.error('Error reading weekly post:', error);
        return NextResponse.json({ error: 'Failed to read post' }, { status: 500 });
    }
}
