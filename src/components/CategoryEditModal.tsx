'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { icons, X } from 'lucide-react';

interface CategoryWithCount {
  id: string;
  name: string;
  icon?: string | null;
  _count: {
    sites: number;
  };
}

interface CategoryEditModalProps {
  category: CategoryWithCount | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: { name: string; icon?: string }) => void;
}

const ICON_GRID = [
  // 基础、通用与形状
  'Home', 'Star', 'Bookmark', 'Globe', 'Compass', 'Map', 'MapPin', 'Navigation', 'Flag', 'Anchor', 'Layers', 'Layout', 'Square', 'Circle', 'Triangle', 'Hexagon', 'Box', 'Package', 'Container', 'Milestone', 'Signpost',

  // 建设、工业、重型与基础设施 (深度加强)
  'Construction', 'HardHat', 'Drill', 'Wrench', 'Hammer', 'Factory', 'Warehouse', 'Cone', 'Fence', 'Wall', 'Mountain', 'Combine',
  'Pickaxe', 'Shovel', 'Tractor', 'Zap', 'Flame', 'DraftingCompass', 'SquareActivity', 'Cylinder', 'Bricks', 'UtilityPole', 'Dam', 'TowerControl', 'Pipette', 'Magnet', 'Weight',

  // 科技、AI、数字化与通信
  'Bot', 'Sparkles', 'Brain', 'Cpu', 'Terminal', 'Code', 'Database', 'Server', 'HardDrive', 'Wifi', 'Cloud', 'Fingerprint', 'ShieldCheck', 'Network', 'Smartphone', 'Laptop', 'Tablet', 'CircuitBoard', 'Rss', 'Antenna', 'Satellite', 'Microchip',

  // 交通、物流、能源与汽车
  'Car', 'Bus', 'Truck', 'Plane', 'Ship', 'TramFront', 'Bicycle', 'Ambulance', 'TrainFront', 'Gauge', 'Fuel', 'Unplug', 'BatteryFull', 'Route', 'Navigation2', 'Activity', 'Plug', 'ZapOff', 'Waypoints',

  // 媒体、设计、摄影与艺术
  'Tv', 'Video', 'Film', 'Music', 'Headphones', 'Mic', 'Gamepad2', 'Play', 'Radio', 'Dices', 'Ghost', 'Camera', 'Cast', 'Brush', 'Palette', 'Highlighter', 'Image', 'Monitor', 'Aperture', 'Contrast', 'Focus',

  // 医疗、科学、健康与环境
  'Stethoscope', 'Pill', 'Microscope', 'Dna', 'Syringe', 'HeartPulse', 'Thermometer', 'BrainCircuit', 'FlaskConical', 'Leaf', 'TreePine', 'Wind', 'Droplets', 'Stretcher', 'ShieldPlus', 'Trees', 'CloudLightning',

  // 教育、法律、文档与办公
  'GraduationCap', 'School', 'Library', 'BookOpen', 'Pencil', 'PenTool', 'Briefcase', 'Clipboard', 'Archive', 'FileText', 'Newspaper', 'Presentation', 'Scale', 'Gavel', 'Landmark', 'Notebook', 'Folder', 'StickyNote',

  // 金融、商业、电商与标签
  'Bitcoin', 'Coins', 'Banknote', 'Wallet', 'CreditCard', 'Receipt', 'TrendingUp', 'BarChart2', 'PieChart', 'ShoppingCart', 'ShoppingBag', 'Store', 'Tag', 'Ticket', 'DollarSign', 'BriefcaseBusiness', 'Handshake',

  // 社交、社区、通讯与表情
  'MessageSquare', 'MessagesSquare', 'Share2', 'Users', 'AtSign', 'Hash', 'Heart', 'Smile', 'Megaphone', 'Link', 'UserPlus', 'Mail', 'Send', 'Phone', 'Bell', 'Annoyed', 'Angry', 'Laugh',

  // 生活、餐饮、购物与节日
  'Utensils', 'Coffee', 'Wine', 'GlassWater', 'Beef', 'Cake', 'IceCream', 'CookingPot', 'Gift', 'Umbrella', 'Sun', 'Moon', 'CloudRain', 'Snowflake', 'BaggageClaim', 'Bed', 'Binoculars'
];

export function CategoryEditModal({ category, isOpen, onClose, onSave }: CategoryEditModalProps) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setName(category?.name || '');
      setSelectedIcon(category?.icon || '');

      // 键盘 ESC 关闭
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);

      // 锁定背景滚动
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      };
    }
  }, [isOpen, category, onClose]);

  const IconComponent = ({ name, size = 20 }: { name: string; size?: number }) => {
    const Icon = icons[name as keyof typeof icons];
    if (!Icon) {
      return <div className="w-4 h-4 text-gray-400">?</div>;
    }
    return <Icon size={size} />;
  };

  const handleSave = async () => {
    if (!name.trim() || !category) return;

    setIsSaving(true);
    try {
      await onSave(category.id, { name, icon: selectedIcon || undefined });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !category || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
    >
      <div
        className="relative rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in duration-200"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div
          className="flex items-center justify-between px-6"
          style={{
            height: '60px',
            borderBottom: '1px solid var(--color-border)'
          }}
        >
          <h2
            className="text-lg font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            编辑分类
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)]"
          >
            <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-6">
          {/* 分类名称 */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              分类名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
              placeholder="输入分类名称"
              autoFocus
            />
          </div>

          {/* 图标选择 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                选择图标模板
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索图标(英文)..."
                  className="text-xs px-2 py-1 rounded border focus:outline-none transition-all w-32 focus:w-48"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>
            </div>

            {/* 图标网格 */}
            <div
              className="grid grid-cols-10 gap-1 p-2 rounded-lg max-h-64 overflow-y-auto"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)'
              }}
            >
              {Array.from(new Set(searchTerm
                ? Object.keys(icons).filter(name =>
                  name.toLowerCase().includes(searchTerm.toLowerCase())
                ).slice(0, 50) // 搜索时限制前50个，防止卡顿
                : ICON_GRID
              )).map((iconName) => (
                <button
                  key={iconName}
                  onClick={() => setSelectedIcon(iconName)}
                  className="aspect-square flex items-center justify-center rounded-lg transition-all hover:scale-110 active:scale-95"
                  title={iconName}
                  style={{
                    backgroundColor: selectedIcon === iconName ? 'var(--color-accent-soft)' : 'transparent',
                    color: selectedIcon === iconName ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    boxShadow: selectedIcon === iconName ? '0 0 0 2px var(--color-accent)' : 'none'
                  }}
                >
                  <IconComponent name={iconName} size={20} />
                </button>
              ))}
              {searchTerm && Object.keys(icons).filter(name =>
                name.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 && (
                  <div className="col-span-10 py-8 text-center text-xs text-gray-500">
                    未找到匹配图标
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 hover:bg-[var(--color-bg-tertiary)]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="px-8 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'white'
            }}
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}