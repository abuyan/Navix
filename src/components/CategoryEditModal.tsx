'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { icons, X, Check, Loader2, ChevronDown } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

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
  onSave: (id: string, data: { name: string; icon?: string; panelId?: string }) => void;
  onDelete?: (id: string) => void;
  isCreate?: boolean;
  panels?: { id: string; name: string }[];  // 可用版块列表
  currentPanelId?: string;  // 当前版块 ID
}

const ICON_GRID = [
  // 基础、通用与形状
  'House', 'Star', 'Bookmark', 'Globe', 'Compass', 'Map', 'MapPin', 'Navigation', 'Flag', 'Anchor', 'Layers', 'Layout', 'Square', 'Circle', 'Triangle', 'Hexagon', 'Box', 'Package', 'Container', 'Milestone', 'Signpost',

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

export function CategoryEditModal({ category, isOpen, onClose, onSave, onDelete, isCreate = false, panels = [], currentPanelId }: CategoryEditModalProps) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const [selectedPanelId, setSelectedPanelId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPanelDropdownOpen, setIsPanelDropdownOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 点击外部关闭下拉框
    const handleClickOutside = (e: MouseEvent) => {
      if (isPanelDropdownOpen && !(e.target as HTMLElement).closest('.panel-select-container')) {
        setIsPanelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPanelDropdownOpen]);

  useEffect(() => {
    if (isOpen) {
      setName(category?.name || '');
      setSelectedIcon(category?.icon || '');
      setSelectedPanelId(currentPanelId || '');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, category, currentPanelId]);

  useEffect(() => {
    if (isOpen) {
      // 保存当前滚动位置
      const scrollY = window.scrollY;

      // 键盘 ESC 关闭
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (showDeleteConfirm) {
            setShowDeleteConfirm(false);
          } else {
            onClose();
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      // 锁定背景滚动
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        // 恢复滚动位置
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen, onClose, showDeleteConfirm]);

  const IconComponent = ({ name, size = 20 }: { name: string; size?: number }) => {
    // 处理旧版本的 Home -> House 映射
    const effectiveName = name === 'Home' ? 'House' : name;
    // @ts-ignore - icons 包含了所有图标组件
    const Icon = icons[effectiveName as keyof typeof icons] as React.ComponentType<{ size?: number }>;

    if (!Icon) {
      return <div className="w-4 h-4 text-gray-400">?</div>;
    }
    return <Icon size={size} />;
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    // 在新建模式下,category 为 null,需要特殊处理
    if (isCreate) {
      setIsSaving(true);
      try {
        await onSave('', { name, icon: selectedIcon || undefined, panelId: selectedPanelId || undefined });
        onClose();
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // 编辑模式
    if (!category) return;

    setIsSaving(true);
    try {
      // 判断 panelId 是否变化，变化时才传递
      const panelIdChanged = selectedPanelId && selectedPanelId !== currentPanelId;
      await onSave(category.id, {
        name,
        icon: selectedIcon || undefined,
        ...(panelIdChanged && { panelId: selectedPanelId })
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!category || !onDelete) return;

    setIsDeleting(true);
    setShowDeleteConfirm(false);
    try {
      await onDelete(category.id);
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !mounted) return null;
  if (!isCreate && !category) return null;

  return createPortal(
    <>
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
              className="text-base font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {isCreate ? '新建分类' : '编辑分类'}
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
            {/* 分类名称和所属版块 */}
            <div className={`flex gap-4 ${!isCreate && panels.length > 1 ? '' : ''}`}>
              {/* 分类名称 */}
              <div className={!isCreate && panels.length > 1 ? 'flex-1' : 'w-full'}>
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
                  className="w-full px-4 h-9 rounded-lg border outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                  placeholder="输入分类名称"
                  autoFocus
                />
              </div>

              {/* 所属版块 - 仅在非新建模式且有多个版块时显示 */}
              {!isCreate && panels.length > 1 && (
                <div className="w-36 panel-select-container relative">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    所属版块
                  </label>
                  <div
                    onClick={() => setIsPanelDropdownOpen(!isPanelDropdownOpen)}
                    className="w-full px-3 h-9 rounded-lg border cursor-pointer flex items-center justify-between transition-colors"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <span className="text-sm truncate mr-2">
                      {panels.find(p => p.id === selectedPanelId)?.name || '选择版块'}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 shrink-0 ${isPanelDropdownOpen ? 'rotate-180' : ''}`}
                      style={{ color: 'var(--color-text-tertiary)' }}
                    />
                  </div>

                  {isPanelDropdownOpen && (
                    <div
                      className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg shadow-xl border overflow-hidden animate-in fade-in zoom-in duration-150"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderColor: 'var(--color-border)',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}
                    >
                      {panels.map(panel => (
                        <div
                          key={panel.id}
                          onClick={() => {
                            setSelectedPanelId(panel.id);
                            setIsPanelDropdownOpen(false);
                          }}
                          className="px-4 py-2 text-sm cursor-pointer transition-colors"
                          style={{
                            backgroundColor: selectedPanelId === panel.id ? 'var(--color-accent-soft)' : 'transparent',
                            color: selectedPanelId === panel.id ? 'var(--color-accent)' : 'var(--color-text-primary)'
                          }}
                          onMouseEnter={(e) => {
                            if (selectedPanelId !== panel.id) e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                          }}
                          onMouseLeave={(e) => {
                            if (selectedPanelId !== panel.id) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {panel.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                      color: selectedIcon === iconName ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      boxShadow: selectedIcon === iconName ? '0 0 0 2px var(--color-text-primary)' : 'none'
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
            className="flex items-center justify-between px-6 py-4"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            {onDelete && !isCreate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick();
                }}
                disabled={isDeleting || isSaving}
                className="px-4 h-9 rounded-lg font-medium transition-colors hover:bg-[var(--color-action-hover)] disabled:opacity-50 text-sm"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {isDeleting ? '删除中...' : '删除分类'}
              </button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={onClose}
                disabled={isDeleting || isSaving}
                className="px-6 h-9 rounded-lg font-medium transition-all hover:bg-[var(--color-action-hover)] active:scale-95 text-sm"
                style={{
                  backgroundColor: 'var(--color-action-bg)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || isSaving || isDeleting}
                className="group flex items-center gap-2 px-6 h-9 rounded-lg font-medium transition-all border disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: 'var(--color-text-primary)',
                  borderColor: 'var(--color-text-primary)',
                  color: 'var(--color-bg-primary)'
                }}
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                <span className="text-sm">{isSaving ? '保存中' : '保存'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="确认删除"
        message={`确定要删除分类 "${category?.name}" 吗？删除后无法恢复，且该分类下的所有站点也会被删除。`}
        confirmText="确认删除"
      />
    </>,
    document.body
  );
}