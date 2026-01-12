import { Category } from '@prisma/client';

export interface CategoryWithCount extends Category {
  _count: {
    sites: number;
  };
}

// 获取所有分类
export async function fetchCategories(): Promise<CategoryWithCount[]> {
  const response = await fetch('/api/categories');
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
}

// 更新分类
export async function updateCategory(
  id: string,
  data: { name?: string; icon?: string; sortOrder?: number }
): Promise<CategoryWithCount> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update category');
  }
  return response.json();
}

// 创建分类
export async function createCategory(
  data: { name: string; icon?: string; sortOrder?: number }
): Promise<CategoryWithCount> {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create category');
  }
  return response.json();
}

// 删除分类
export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete category');
  }
}