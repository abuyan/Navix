import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, icon, slug, sortOrder } = body;

        const updatedPanel = await prisma.panel.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(icon !== undefined && { icon }),
                ...(slug !== undefined && { slug }),
                ...(sortOrder !== undefined && { sortOrder }),
            }
        });

        return NextResponse.json(updatedPanel);
    } catch (error) {
        console.error('Update panel error:', error);
        return NextResponse.json(
            { error: 'Failed to update panel' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Note: You might want to handle categories belonging to this panel
        // For now, let's just let it fail if there are foreign key constraints,
        // or we could delete them Cascade-style if configured in Prisma.
        // The schema doesn't have onDelete: Cascade explicitly but SQLite usually respects it if set.

        await prisma.panel.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete panel error:', error);
        return NextResponse.json(
            { error: 'Failed to delete panel. Note: You must remove all categories first.' },
            { status: 500 }
        );
    }
}
