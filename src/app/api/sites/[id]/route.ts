import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
        const { title, url, description, icon, categoryId, sortOrder, isPinned, tags, aiAnalyzed } = body;

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (url !== undefined) updateData.url = url;
        if (description !== undefined) updateData.description = description;
        if (icon !== undefined) updateData.icon = icon;
        if (categoryId !== undefined) updateData.categoryId = categoryId;
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
        if (isPinned !== undefined) updateData.isPinned = isPinned;
        if (tags !== undefined) updateData.tags = tags;
        if (aiAnalyzed !== undefined) updateData.aiAnalyzed = aiAnalyzed;

        const updatedSite = await prisma.site.update({
            where: { id, userId: session.user.id },
            data: updateData
        });

        return NextResponse.json(updatedSite);
    } catch (error: any) {
        console.error('Update site error:', error);
        return NextResponse.json(
            { error: error.message || '更新网页失败' },
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

        await prisma.site.delete({
            where: { id, userId: session.user.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete site error:', error);
        return NextResponse.json(
            { error: '删除网页失败' },
            { status: 500 }
        );
    }
}
