import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim().toLowerCase();

    if (!query || query.length < 1) {
        return NextResponse.json([]);
    }

    try {
        // 获取用户所有收藏夹的网站，包含收藏夹信息
        const sites = await prisma.site.findMany({
            where: {
                userId: session.user.id,
                OR: [
                    { title: { contains: query } },
                    { description: { contains: query } },
                    { url: { contains: query } }
                ]
            },
            include: {
                category: {
                    include: {
                        panel: true
                    }
                }
            },
            take: 20
        }) as any[]; // 使用 as any[] 临时解决 include 类型推导问题

        // 格式化搜索结果
        const results = sites.map(site => ({
            id: site.id,
            title: site.title,
            description: site.description,
            url: site.url,
            icon: site.icon,
            categoryId: site.categoryId,
            categoryName: site.category.name,
            panelId: site.category.panelId,
            panelSlug: site.category.panel?.slug || site.category.panelId,
            panelName: site.category.panel?.name || '未分类'
        }));

        return NextResponse.json(results);
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
