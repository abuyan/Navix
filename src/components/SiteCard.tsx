'use client';

import { ExternalLink, Edit, MoreHorizontal, Trash2, Settings, TrendingUp, ChevronRight, Globe } from 'lucide-react';
import { Site } from '@prisma/client';
import { useRef, MouseEvent, useState, useEffect } from 'react';
import { useToast } from './Toast';
import { SiteEditModal } from './SiteEditModal';
import { ConfirmModal } from './ConfirmModal';

export default function SiteCard({ site, categories = [], onUpdate, onDelete, user }: { site: Site; categories?: { id: string; name: string }[]; onUpdate?: (updatedSite: Site) => void; onDelete?: (id: string) => void; user?: any }) {
    const { showToast } = useToast();
    const cardRef = useRef<HTMLDivElement>(null);
    const [glarePosition, setGlarePosition] = useState({ x: 0, y: 0, opacity: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);


    // 判断是否为公网地址
    const isPublicSite = (url: string) => {
        try {
            const hostname = new URL(url).hostname;
            // 排除 localhost 和常见私有 IP 段
            if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
            if (hostname.startsWith('192.168.')) return false;
            if (hostname.startsWith('10.')) return false;
            // 172.16.x.x - 172.31.x.x
            if (hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) return false;
            return true;
        } catch {
            return false;
        }
    };

    // 获取初始图标逻辑 (AI 提取的 Base64 会在这里直接被返回，不受影响)
    const getInitialIcon = (url: string, icon?: string | null) => {
        if (icon) return icon; // 数据库有值（包括 AI 保存的），绝对优先

        // 只有当数据库没图标时，才进行智能分流
        if (isPublicSite(url)) {
            try {
                const hostname = new URL(url).hostname;
                return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
            } catch {
                return '';
            }
        }
        return ''; // 内网直接返回空，触发灰色占位符
    };

    const [iconUrl, setIconUrl] = useState(getInitialIcon(site.url, site.icon));
    // 关键修复：如果初始图标为空，必须立即设置 hasError 为 true，防止 img 渲染空 src
    const [hasError, setHasError] = useState(!getInitialIcon(site.url, site.icon));

    // 当 site.icon 或 site.url 改变时，更新 iconUrl
    useEffect(() => {
        const newIcon = getInitialIcon(site.url, site.icon);
        setIconUrl(newIcon);
        // 如果计算出的图标为空，直接显示占位符；否则重置错误状态等待加载
        setHasError(!newIcon);
    }, [site.icon, site.url]);

    const handleIconError = () => {
        // 如果当前是 Google 源失败，尝试二线方案 favicon.im
        if (iconUrl.includes('google.com')) {
            try {
                const hostname = new URL(site.url).hostname;
                setIconUrl(`https://favicon.im/${hostname}?larger=true`);
                return;
            } catch { }
        }

        // 如果已经是 favicon.im 失败，或者其他情况，彻底回退
        setHasError(true);
    };

    // 新增：图片加载完成后的质量检测
    const handleIconLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const img = e.currentTarget;
        // 质量检测涵盖 Google 和 favicon.im
        const isThirdParty = img.src.includes('google.com') || img.src.includes('favicon.im');

        if (isThirdParty && img.naturalWidth < 32) {
            // 如果当前是 Google 的低质量图，尝试回退到 favicon.im
            if (img.src.includes('google.com')) {
                // 手动触发 Error 处理逻辑以切换源
                handleIconError();
            } else {
                // 如果是 favicon.im 也烂，或者其他情况，直接显示占位符
                setHasError(true);
            }
        }
    };


    // 3D Tilt Effect Logic
    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Lift-up effect: the area under the mouse comes forward
        const rotateX = ((y - centerY) / centerY) * 8;
        const rotateY = ((x - centerX) / centerX) * -8;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

        // Update Glare Position
        setGlarePosition({
            x: (x / rect.width) * 100,
            y: (y / rect.height) * 100,
            opacity: 1
        });
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;
        cardRef.current.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        setGlarePosition(prev => ({ ...prev, opacity: 0 }));
        setIsHovered(false);
    };

    const handleClick = async (e: MouseEvent<HTMLAnchorElement>) => {
        // 如果点击的是编辑/更多按钮区域，不触发跳转
        if ((e.target as HTMLElement).closest('.action-button')) {
            e.preventDefault();
            return;
        }

        try {
            await fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: site.id }),
            });

            // 实时更新本地点击量并触发父组件重排序
            if (onUpdate) {
                onUpdate({ ...site, visits: (site.visits || 0) + 1 });
            }
        } catch (error) {
            console.error('Failed to track visit:', error);
        }
    };

    const handleEditClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleDeleteClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const response = await fetch(`/api/sites/${site.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete site');


            if (onDelete) {
                onDelete(site.id);
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to delete site:', error);
            showToast('删除失败，请重试', 'error');
        }
    };

    const handleSave = async (id: string | null, data: Partial<Site>) => {
        if (!id) return;
        try {
            const response = await fetch(`/api/sites/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to update site');
            }

            if (onUpdate) {
                onUpdate({ ...site, ...data } as Site);
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to update site:', error);
            throw error;
        }
    };

    return (
        <div className="relative">
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={handleMouseLeave}
                className="card-glow group relative flex flex-col gap-3 p-4 rounded-lg transition-all duration-150 ease-out"
                style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    boxShadow: isHovered ? 'var(--shadow-card-hover)' : 'none',
                    borderColor: isHovered ? 'var(--color-border-hover)' : 'var(--color-border)',
                    transformStyle: 'preserve-3d',
                    willChange: 'transform, box-shadow',
                    // @ts-ignore
                    '--mouse-x': `${glarePosition.x}%`,
                    // @ts-ignore
                    '--mouse-y': `${glarePosition.y}%`
                } as React.CSSProperties}
            >
                {/* Dynamic Glare Overlay */}
                <div
                    className="pointer-events-none absolute inset-0 rounded-lg transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, var(--color-glare) 0%, transparent 80%)`,
                        opacity: glarePosition.opacity,
                        zIndex: 10,
                        transform: 'translateZ(10px)'
                    }}
                />


                {/* 操作按钮组 - 极简透明样式 - Only show if user is authenticated */}
                {user && (
                    <div
                        className="absolute top-2.5 right-2 flex items-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                        style={{
                            zIndex: 50,
                            transform: 'translateZ(30px)'
                        }}
                    >
                        <button
                            onClick={handleEditClick}
                            className="p-1 rounded-md transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center justify-center"
                            title="编辑站点"
                        >
                            <Edit size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                        </button>

                        <button
                            onClick={handleDeleteClick}
                            className="p-1 rounded-md transition-colors hover:bg-[var(--color-bg-tertiary)] flex items-center justify-center"
                            title="删除站点"
                        >
                            <Trash2 size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                        </button>
                    </div>
                )}

                <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleClick}
                    className="flex flex-col gap-2"
                >
                    {/* First Row: Icon + Title */}
                    <div className="flex items-center min-w-0" style={{ transform: 'translateZ(15px)' }}>
                        <div
                            className="w-5 h-5 flex items-center justify-center shrink-0 overflow-hidden transition-all duration-300"
                            style={{
                                transform: 'translateZ(5px)',
                                width: isHovered ? '0' : '20px',
                                opacity: isHovered ? 0 : 1,
                                marginRight: isHovered ? '0' : '8px'
                            }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {hasError ? (
                                <div className="w-full h-full flex items-center justify-center rounded-md bg-[var(--color-bg-tertiary)]" style={{ transform: 'scale(1.1)' }}>
                                    <Globe size={12} className="text-[var(--color-text-tertiary)]" />
                                </div>
                            ) : (
                                <img
                                    src={iconUrl}
                                    alt={site.title}
                                    className="w-full h-full object-contain"
                                    onError={handleIconError}
                                    onLoad={handleIconLoad}
                                />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3
                                className="font-bold text-[15px] truncate transition-colors duration-200"
                                style={{
                                    color: 'var(--color-text-primary)',
                                    letterSpacing: '-0.01em',
                                    lineHeight: '1.2'
                                }}
                            >
                                {site.title}
                            </h3>
                        </div>
                    </div>

                    {/* Second Row: Description + Stats */}
                    <div className="flex items-end justify-between gap-3 min-w-0" style={{ transform: 'translateZ(8px)' }}>
                        <p
                            className="text-[11px] truncate leading-relaxed transition-colors flex-1"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            {site.description || new URL(site.url).hostname.replace('www.', '')}
                        </p>

                        <div
                            className="flex items-center gap-1.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity pb-0.5"
                            style={{
                                fontSize: '10px',
                                color: 'var(--color-text-secondary)'
                            }}
                            title={`点击量: ${site.visits || 0}`}
                        >
                            <TrendingUp size={10} className="stroke-[2.5px]" />
                            <span className="font-medium">{site.visits || 0}</span>
                        </div>
                    </div>
                </a>
            </div>

            {/* Tooltip 悬浮提示 - 黑底白字跳转地址（移动到下方，箭头向上） */}
            {isHovered && (
                <div
                    className="absolute z-[60] px-3 py-1.5 rounded-lg shadow-xl pointer-events-none break-all text-center"
                    style={{
                        top: 'calc(100% + 12px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 'max-content',
                        maxWidth: 'min(400px, 80vw)',
                        backgroundColor: 'var(--color-tooltip-bg)',
                        border: '1px solid var(--color-tooltip-border)',
                        color: 'var(--color-tooltip-text)',
                        fontSize: '11px',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                >
                    {site.description || site.url}
                    {/* 小箭头 - 指向上方 */}
                    <div
                        className="absolute"
                        style={{
                            top: '-4px',
                            left: '50%',
                            marginLeft: '-4px',
                            width: '8px',
                            height: '8px',
                            backgroundColor: 'var(--color-tooltip-bg)',
                            borderLeft: '1px solid var(--color-tooltip-border)',
                            borderTop: '1px solid var(--color-tooltip-border)',
                            transform: 'rotate(45deg)'
                        }}
                    />
                </div>
            )}

            {/* 编辑模态框 */}
            <SiteEditModal
                site={site}
                categories={categories}
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                onSave={handleSave}
            />

            {/* 删除确认弹窗 */}
            <ConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="删除站点"
                message={(
                    <span>
                        确定要删除站点
                        <span className="font-bold px-1 inline-block max-w-[200px] truncate align-bottom" title={site.title}>
                            “{site.title}”
                        </span>
                        吗？删除后将无法恢复。
                    </span>
                )}
                confirmText="删除"
                type="danger"
            />
        </div>
    );
}
