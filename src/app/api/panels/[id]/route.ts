import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, icon, slug, sortOrder, isPublic } = body;

        const updatedPanel = await prisma.panel.update({
            where: { id, userId: session.user.id },
            data: {
                ...(name !== undefined && { name }),
                ...(icon !== undefined && { icon }),
                ...(slug !== undefined && { slug }),
                ...(sortOrder !== undefined && { sortOrder }),
                ...(isPublic !== undefined && { isPublic }),
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
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await prisma.panel.delete({
            where: { id, userId: session.user.id }
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
