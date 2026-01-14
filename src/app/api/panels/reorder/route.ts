import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// 批量更新排序
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { panels } = body;  // [{ id: string, sortOrder: number }]

        if (!panels || !Array.isArray(panels)) {
            return NextResponse.json(
                { error: 'panels array is required' },
                { status: 400 }
            );
        }

        // 批量更新
        await Promise.all(
            panels.map((p: { id: string; sortOrder: number }) =>
                prisma.panel.update({
                    where: { id: p.id },
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
