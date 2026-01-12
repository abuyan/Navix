import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, url, description, icon, sortOrder, isPinned, categoryId } = body;

        const updatedSite = await prisma.site.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(url !== undefined && { url }),
                ...(description !== undefined && { description }),
                ...(icon !== undefined && { icon }),
                ...(sortOrder !== undefined && { sortOrder }),
                ...(isPinned !== undefined && { isPinned }),
                ...(categoryId !== undefined && { categoryId })
            }
        });

        return NextResponse.json(updatedSite);
    } catch (error) {
        console.error('Update site error:', error);
        return NextResponse.json(
            { error: '更新站点失败' },
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
