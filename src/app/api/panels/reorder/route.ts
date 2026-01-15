import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// 批量更新排序
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const body = await request.json();
        const { panels } = body;  // [{ id: string, sortOrder: number }]

        if (!panels || !Array.isArray(panels)) {
            return NextResponse.json(
                { error: 'panels array is required' },
                { status: 400 }
            );
        }

        // 批量更新，加入 userId 校验确保安全
        await Promise.all(
            panels.map((p: { id: string; sortOrder: number }) =>
                prisma.panel.update({
                    where: { id: p.id, userId },
                    data: { sortOrder: p.sortOrder }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error reordering panels:', error);
        return NextResponse.json(
            { error: 'Failed to reorder panels' },
            { status: 500 }
        );
    }
}
