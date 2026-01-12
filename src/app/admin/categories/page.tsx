'use client';

import { useState, useEffect } from 'react';
import { Category, Site } from '@prisma/client';
import { Plus, Edit, Trash2, GripVertical, Save, X, ArrowUp, ArrowDown } from 'lucide-react';
import * as Icons from 'lucide-react';
import { IconSelector } from '@/components/IconSelector';

interface CategoryWithCount extends Category {
  _count: {
    sites: number;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', icon: '' });
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: CategoryWithCount) => {
    setEditingCategory(category.id);
    setEditForm({ name: category.name, icon: category.icon || '' });
  };

  const handleSave = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        await fetchCategories();
        setEditingCategory(null);
      }
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？分类下的所有网站也会被删除。')) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchCategories();
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleCreate = async () => {
    if (!newCategory.name.trim()) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });

      if (response.ok) {
        await fetchCategories();
        setNewCategory({ name: '', icon: '' });
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const moveCategory = async (id: string, direction: 'up' | 'down') => {
    const index = categories.findIndex(cat => cat.id === id);
    if (index === -1) return;

    const newCategories = [...categories];
    const currentSortOrder = newCategories[index].sortOrder;

    if (direction === 'up' && index > 0) {
      const targetCategory = newCategories[index - 1];
      newCategories[index - 1] = { ...newCategories[index], sortOrder: targetCategory.sortOrder };
      newCategories[index] = { ...targetCategory, sortOrder: currentSortOrder };
    } else if (direction === 'down' && index < newCategories.length - 1) {
      const targetCategory = newCategories[index + 1];
      newCategories[index + 1] = { ...newCategories[index], sortOrder: targetCategory.sortOrder };
      newCategories[index] = { ...targetCategory, sortOrder: currentSortOrder };
    }

    // 更新数据库
    for (let i = 0; i < newCategories.length; i++) {
      try {
        await fetch(`/api/categories/${newCategories[i].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: i })
        });
      } catch (error) {
        console.error('Failed to update category order:', error);
        return;
      }
    }

    await fetchCategories();
  };

  const IconComponent = ({ icon }: { icon?: string }) => {
    if (!icon) return <div className="w-6 h-6 text-gray-400">-</div>;

    const Icon = (Icons as any)[icon];
    return Icon ? <Icon size={24} /> : <div className="w-6 h-6 text-gray-400">?</div>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">分类管理</h1>

        {/* 添加新分类 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">添加新分类</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">分类名称</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入分类名称"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">图标:</span>
              {newCategory.icon ? (
                <IconComponent icon={newCategory.icon} />
              ) : (
                <div className="w-6 h-6 text-gray-400">-</div>
              )}
            </div>
            <button
              onClick={() => setShowIconSelector(true)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              选择图标
            </button>
            <button
              onClick={handleCreate}
              disabled={!newCategory.name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 分类列表 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <h2 className="text-xl font-semibold p-6 border-b">分类列表</h2>
          {categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              暂无分类
            </div>
          ) : (
            <div className="divide-y">
              {categories.map((category, index) => (
                <div key={category.id} className="p-6 flex items-center gap-4">
                  <button
                    onClick={() => moveCategory(category.id, 'up')}
                    disabled={index === 0}
                    className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => moveCategory(category.id, 'down')}
                    disabled={index === categories.length - 1}
                    className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
                  >
                    <ArrowDown size={16} />
                  </button>

                  <GripVertical className="text-gray-400" />

                  {editingCategory === category.id ? (
                    <div className="flex-1 flex gap-4 items-center">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleSave(category.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        {category.icon && <IconComponent icon={category.icon} />}
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {category._count.sites} 个网站
                      </div>
                    </div>
                  )}

                  {editingCategory !== category.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 hover:bg-gray-100 rounded"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 图标选择器 */}
      {showIconSelector && (
        <IconSelector
          selectedIcon={newCategory.icon}
          onIconSelect={(icon) => setNewCategory({ ...newCategory, icon })}
          onClose={() => setShowIconSelector(false)}
        />
      )}
    </div>
  );
}