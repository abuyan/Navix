'use client';

import { useState } from 'react';
import * as Icons from 'lucide-react';

interface IconSelectorProps {
  selectedIcon?: string;
  onIconSelect: (icon: string) => void;
  onClose: () => void;
}

const ICON_GRID = [
  'Home', 'Star', 'Bookmark', 'Globe', 'Folder', 'Tag',
  'Computer', 'Smartphone', 'Monitor', 'Tablet',
  'Search', 'Settings', 'User', 'Users', 'Database',
  'Cloud', 'Code', 'Palette', 'Music', 'Video',
  'Camera', 'Image', 'FileText', 'Download', 'Upload',
  'Heart', 'Share', 'Copy', 'Trash2', 'Edit', 'Plus',
  'Minus', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Menu', 'X', 'Check', 'Bell', 'Mail', 'Calendar',
  'Clock', 'MapPin', 'Phone', 'Mail', 'Linkedin', 'Github',
  'Twitter', 'Instagram', 'Youtube', 'ShoppingCart', 'CreditCard'
];

export function IconSelector({ selectedIcon, onIconSelect, onClose }: IconSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIcons = ICON_GRID.filter(iconName =>
    iconName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const IconComponent = ({ name }: { name: string }) => {
    const Icon = Icons[name as keyof typeof Icons] as React.ComponentType<{ size?: number }>;
    if (!Icon || typeof Icon !== 'function') {
      return <div className="w-5 h-5 text-gray-400">?</div>;
    }
    return <Icon size={20} />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">选择图标</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Icons.X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="搜索图标..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-6 gap-3 overflow-y-auto max-h-96">
          {filteredIcons.map((iconName) => (
            <button
              key={iconName}
              onClick={() => {
                onIconSelect(iconName);
                onClose();
              }}
              className={`p-2 rounded hover:bg-gray-100 flex flex-col items-center gap-1 transition-colors ${selectedIcon === iconName ? 'bg-blue-100 hover:bg-blue-200' : ''
                }`}
            >
              <IconComponent name={iconName} />
              <span className="text-xs text-gray-600">{iconName}</span>
            </button>
          ))}
        </div>

        {filteredIcons.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            没有找到匹配的图标
          </div>
        )}
      </div>
    </div>
  );
}