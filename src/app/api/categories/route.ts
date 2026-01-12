import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// 获取所有分类
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
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
    const body = await request.json();
    const { name, icon, sortOrder } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // 获取当前最大排序值
    const maxCategory = await prisma.category.findFirst({
      orderBy: { sortOrder: 'desc' }
    });
    const newSortOrder = sortOrder ?? (maxCategory?.sortOrder ?? 0) + 1;

    const category = await prisma.category.create({
      data: {
        name,
        icon: icon || null,
        sortOrder: newSortOrder
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