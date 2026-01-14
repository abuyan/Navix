import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// 获取所有面板
export async function GET() {
    try {
        const panels = await prisma.panel.findMany({
            orderBy: { sortOrder: 'asc' },
        });

        return NextResponse.json(panels);
    } catch (error) {
        console.error('Error fetching panels:', error);
        return NextResponse.json(
            { error: 'Failed to fetch panels' },
            { status: 500 }
        );
    }
}

// 创建新面板
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, icon, slug } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Panel name is required' },
                { status: 400 }
            );
        }

        // 获取当前最大排序值
        const maxPanel = await prisma.panel.findFirst({
            orderBy: { sortOrder: 'desc' }
        });
        const newSortOrder = (maxPanel?.sortOrder ?? 0) + 1;

        const panel = await prisma.panel.create({
            data: {
                name,
                icon: icon || null,
                slug: slug || null,
                sortOrder: newSortOrder
            }
        });

        return NextResponse.json(panel);
    } catch (error) {
        console.error('Error creating panel:', error);
        return NextResponse.json(
            { error: 'Failed to create panel' },
            { status: 500 }
        );
    }
}
