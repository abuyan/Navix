'use client';

import React, { useState } from 'react';
import { CategoryEditModal } from './CategoryEditModal';
import { SiteEditModal } from './SiteEditModal';
import { Category, Site } from '@prisma/client';
import { Plus, icons } from 'lucide-react';

interface CategoryWithCount extends Category {
  _count: {
    sites: number;
  };
}

interface CategoryTitleProps {
  category: CategoryWithCount;
  categories: { id: string; name: string }[];
  onEditComplete: (id: string, data: { name?: string; icon?: string }) => void;
  onAddSiteComplete?: (site: Site) => void;
}

export function CategoryTitle({ category, categories, onEditComplete, onAddSiteComplete }: CategoryTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingSite, setIsAddingSite] = useState(false);

  const handleAddSite = async (id: string | null, data: Partial<Site>) => {
    try {
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, categoryId: data.categoryId || category.id }),
      });

      if (!response.ok) throw new Error('Failed to create site');
      const newSite = await response.json();

      // 通知父组件更新状态，避免 window.location.reload()
      if (onAddSiteComplete) {
        onAddSiteComplete(newSite);
      } else {
        window.location.reload();
      }
      setIsAddingSite(false);
    } catch (error) {
      console.error('Failed to add site:', error);
      alert('添加站点失败');
    }
  };

  const IconComponent = ({ icon }: { icon?: string }) => {
    if (!icon) return null;

    const Icon = icons[icon as keyof typeof icons];
    return Icon ? <Icon size={20} /> : <div className="w-5 h-5 text-gray-400">?</div>;
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* 图标 */}
          {category.icon && (
            <IconComponent icon={category.icon} />
          )}

          {/* 标题 */}
          <div
            className="relative"
            onDoubleClick={() => setIsEditing(true)}
          >
            <h2
              className="text-lg font-bold cursor-text hover:bg-[var(--color-bg-tertiary)] px-1 rounded transition-colors"
              style={{ color: 'var(--color-text-primary)' }}
              title="双击编辑"
            >
              {category.name}
            </h2>
          </div>

          {/* 站点数量 */}
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-tertiary)',
              border: '1px solid var(--color-border)'
            }}
          >
            {category._count.sites}
          </span>

          {/* 添加站点按钮 */}
          <button
            onClick={() => setIsAddingSite(true)}
            className="p-1 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-colors group/btn"
            title="添加站点"
          >
            <Plus size={16} className="text-[var(--color-text-tertiary)] group-hover/btn:text-[var(--color-accent)]" />
          </button>
        </div>
      </div>

      {/* 编辑模态窗口 */}
      <CategoryEditModal
        category={category}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={onEditComplete}
      />

      {/* 添加站点模态窗口 */}
      <SiteEditModal
        isOpen={isAddingSite}
        categories={categories}
        defaultCategoryId={category.id}
        onClose={() => setIsAddingSite(false)}
        onSave={handleAddSite}
      />
    </>
  );
}

export default CategoryTitle;