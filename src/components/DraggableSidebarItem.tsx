'use client';

import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { Identifier } from 'dnd-core';

type Category = {
    id: string;
    name: string;
    icon?: string | null;
};

interface DraggableSidebarItemProps {
    category: Category;
    index: number;
    isActive: boolean;
    isCollapsed: boolean;
    IconComponent: React.ComponentType<any>;
    onMove: (dragIndex: number, hoverIndex: number) => void;
    onDragEnd: () => void;
    onClick: () => void;
}

interface DragItem {
    index: number;
    id: string;
    type: string;
}

const MENU_ITEM_HEIGHT = 44;

export function DraggableSidebarItem({
    category,
    index,
    isActive,
    isCollapsed,
    IconComponent,
    onMove,
    onDragEnd,
    onClick
}: DraggableSidebarItemProps) {
    const ref = useRef<HTMLButtonElement>(null);

    const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
        accept: 'SIDEBAR_CATEGORY',
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId(),
            };
        },
        hover(item: DragItem, monitor) {
            if (!ref.current) {
                return;
            }

            const dragIndex = item.index;
            const hoverIndex = index;

            // 不要替换自己
            if (dragIndex === hoverIndex) {
                return;
            }

            // 执行移动
            onMove(dragIndex, hoverIndex);

            // 更新 item 的 index
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: 'SIDEBAR_CATEGORY',
        item: () => {
            return { id: category.id, index };
        },
        end: (item, monitor) => {
            if (monitor.didDrop() || !monitor.didDrop()) {
                // Regardless of whether it was dropped on a target, 
                // we want to signal the end of drag to the parent
                onDragEnd();
            }
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    drag(drop(ref));

    return (
        <button
            ref={ref}
            data-handler-id={handlerId}
            onClick={onClick}
            title={isCollapsed ? category.name : undefined}
            className="w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200 group"
            style={{
                height: `${MENU_ITEM_HEIGHT}px`,
                padding: isCollapsed ? '0' : '0 12px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: isCollapsed ? '0' : '12px',
                backgroundColor: isActive ? 'var(--color-accent-soft)' : 'transparent',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                boxShadow: 'none',
                opacity: isDragging ? 0.4 : 1,
                cursor: isDragging ? 'grabbing' : 'grab',
            }}
        >
            <IconComponent
                className="w-5 h-5 transition-colors flex-shrink-0"
                style={{
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)'
                }}
            />
            {!isCollapsed && (
                <>
                    <span className="flex-1 text-left whitespace-nowrap overflow-hidden">{category.name}</span>
                    {isActive && (
                        <div
                            className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                            style={{ backgroundColor: 'var(--color-accent)' }}
                        />
                    )}
                </>
            )}
        </button>
    );
}
