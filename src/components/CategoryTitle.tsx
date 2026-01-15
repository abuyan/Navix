'use client';

import React, { useState } from 'react';
import { useToast } from './Toast';
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
  onEditComplete: (id: string, data: { name?: string; icon?: string; panelId?: string }) => void;
  onAddSiteComplete?: (site: Site) => void;
  onDeleteCategory?: (id: string) => void;
  panels?: { id: string; name: string }[];  // 可用版块列表
  currentPanelId?: string;  // 当前版块 ID
  user?: any; // Add user prop
}

export function CategoryTitle({ category, categories, onEditComplete, onAddSiteComplete, onDeleteCategory, panels = [], currentPanelId, user }: CategoryTitleProps) {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingSite, setIsAddingSite] = useState(false);

  // ... (existing helper functions: handleAddSite, IconComponent)

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
      showToast('添加网页失败', 'error');
    }
  };

  const IconComponent = ({ icon }: { icon?: string }) => {
    if (!icon) return null;

    // 处理 Home -> House 映射
    const effectiveName = icon === 'Home' ? 'House' : icon;
    // @ts-ignore
    const Icon = icons[effectiveName as keyof typeof icons] as React.ComponentType<{ size?: number }>;

    return Icon ? <Icon size={14} /> : <div className="w-3.5 h-3.5 text-gray-400">?</div>;
  };

  return (
    <>
      <div id={`title-${category.id}`} className="flex items-center gap-2 mb-3">
        {/* ... (existing rendering logic) */}
        <div className="flex items-center gap-2">
          {/* 图标 */}
          {category.icon && (
            <IconComponent icon={category.icon} />
          )}

          {/* 标题 */}
          <div
            className="relative"
            onDoubleClick={() => user && setIsEditing(true)}
          >
            <h2
              className={`text-sm font-bold px-1 rounded transition-colors ${user ? 'cursor-text hover:bg-[var(--color-bg-tertiary)]' : ''}`}
              style={{ color: 'var(--color-text-primary)' }}
              title={user ? "双击编辑" : undefined}
            >
              {category.name}
            </h2>
          </div>

          {/* 网页数量 */}
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

          {/* 添加网页按钮 - Only show if user is authenticated */}
          {user && (
            <button
              onClick={() => setIsAddingSite(true)}
              className="p-1 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-colors group/btn"
              title="添加网页"
            >
              <Plus size={14} className="text-[var(--color-text-tertiary)] group-hover/btn:text-[var(--color-accent)]" />
            </button>
          )}
        </div>
      </div>

      {/* 编辑模态窗口 */}
      <CategoryEditModal
        category={category}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={onEditComplete}
        onDelete={onDeleteCategory}
        panels={panels}
        currentPanelId={currentPanelId}
      />

      {/* 添加网页模态窗口 */}
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