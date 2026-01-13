import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // 获取所有文章的浏览量
        const allViews = await prisma.weeklyPost.findMany({
            select: {
                slug: true,
                views: true
            }
        });

        // 转换为 Map 格式方便查询
        const viewsMap = allViews.reduce((acc, item) => {
            acc[item.slug] = item.views;
            return acc;
        }, {} as Record<string, number>);

        return NextResponse.json(viewsMap);
    } catch (error) {
        console.error('Error getting all views:', error);
        return NextResponse.json({}, { status: 500 });
    }
}
