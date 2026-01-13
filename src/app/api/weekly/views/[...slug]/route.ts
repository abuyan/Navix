import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string[] }> }
) {
    try {
        const resolvedParams = await params;
        const slug = resolvedParams.slug.join('/');

        // 使用 upsert 来增加浏览量,如果记录不存在则创建
        const weeklyPost = await prisma.weeklyPost.upsert({
            where: { slug },
            update: {
                views: {
                    increment: 1
                }
            },
            create: {
                slug,
                views: 1
            }
        });

        return NextResponse.json({ views: weeklyPost.views });
    } catch (error) {
        console.error('Error incrementing views:', error);
        return NextResponse.json({ error: 'Failed to increment views' }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string[] }> }
) {
    try {
        const resolvedParams = await params;
        const slug = resolvedParams.slug.join('/');

        const weeklyPost = await prisma.weeklyPost.findUnique({
            where: { slug }
        });

        return NextResponse.json({ views: weeklyPost?.views || 0 });
    } catch (error) {
        console.error('Error getting views:', error);
        return NextResponse.json({ error: 'Failed to get views' }, { status: 500 });
    }
}
