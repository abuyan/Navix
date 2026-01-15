import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// 获取所有分类
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const panelId = searchParams.get('panelId');

    const categories = await prisma.category.findMany({
      where: panelId ? { panelId } : undefined,
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { sites: true }
        }
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// 创建新分类
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, icon, sortOrder, panelId } = body;

    if (!name || !panelId) {
      return NextResponse.json(
        { error: 'Name and panelId are required' },
        { status: 400 }
      );
    }

    // 获取当前面板下最大排序值
    const maxCategory = await prisma.category.findFirst({
      where: { panelId },
      orderBy: { sortOrder: 'desc' }
    });
    const newSortOrder = sortOrder ?? (maxCategory?.sortOrder ?? 0) + 1;

    const category = await prisma.category.create({
      data: {
        name,
        icon: icon || null,
        sortOrder: newSortOrder,
        panelId
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}