import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedSite);
    } catch (error: any) {
        console.error('Update site error:', error);
        return NextResponse.json(
            { error: error.message || '更新站点失败' },
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

        await prisma.site.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete site error:', error);
        return NextResponse.json(
            { error: '删除站点失败' },
            { status: 500 }
        );
    }
}
