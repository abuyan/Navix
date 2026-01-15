import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const body = await request.json();
        const { categoryOrders } = body as { categoryOrders: { id: string; sortOrder: number }[] };

        if (!categoryOrders || !Array.isArray(categoryOrders)) {
            return NextResponse.json(
                { error: '无效的请求数据' },
                { status: 400 }
            );
        }

        // 批量更新分类的 sortOrder，加入 userId 校验确保安全
        await prisma.$transaction(
            categoryOrders.map((item) =>
                prisma.category.update({
                    where: { id: item.id, userId },
                    data: { sortOrder: item.sortOrder },
                })
            )
        );

        return NextResponse.json({
            success: true,
            message: '分类顺序已保存'
        });

    } catch (error) {
        console.error('Save order error:', error);
        return NextResponse.json(
            { error: `保存失败: ${error instanceof Error ? error.message : '未知错误'}` },
            { status: 500 }
        );
    }
}
