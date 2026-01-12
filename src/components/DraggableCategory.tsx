'use client';

import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical } from 'lucide-react';
import { CategoryEditModal } from './CategoryEditModal';
import { Category } from '@prisma/client';

interface CategoryWithCount extends Category {
  _count: {
    sites: number;
  };
}

interface DraggableCategoryProps {
  category: CategoryWithCount;
  index: number;
  onEdit: (category: CategoryWithCount) => void;
  onEditComplete: (id: string, data: { name?: string; icon?: string }) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

export function DraggableCategory({
  category,
  index,
  onEdit,
  onEditComplete,
  onMove
}: DraggableCategoryProps) {
  const [isEditing, setIsEditing] = useState(false);

  const ref = React.useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'CATEGORY',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'CATEGORY',
    hover(item: { index: number }, monitor) {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset?.y || 0) - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  const opacity = isDragging ? 0.4 : 1;

  const IconComponent = ({ icon }: { icon?: string }) => {
    if (!icon) return null;

    const Icons = require('lucide-react');
    const Icon = Icons[icon];
    return Icon ? <Icon size={20} /> : <div className="w-5 h-5 text-gray-400">?</div>;
  };

  return (
    <>
      <div
        ref={ref}
        style={{ opacity }}
        className="flex items-center gap-3 mb-5 group"
      >
        <div className="flex items-center gap-3">
          {/* 拖拽手柄 */}
          <GripVertical className="text-gray-400 cursor-grab" size={16} />

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
        </div>
      </div>

      {/* 编辑模态窗口 */}
      <CategoryEditModal
        category={category}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={onEditComplete}
      />
    </>
  );
}

export default DraggableCategory;