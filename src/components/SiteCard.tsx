'use client';

import { ExternalLink, Edit, MoreHorizontal, Trash2, Settings, TrendingUp, ChevronRight } from 'lucide-react';
import { Site } from '@prisma/client';
import { useRef, MouseEvent, useState, useEffect } from 'react';
import { SiteEditModal } from './SiteEditModal';
import { ConfirmModal } from './ConfirmModal';

export default function SiteCard({ site, categories = [], onUpdate, onDelete }: { site: Site; categories?: { id: string; name: string }[]; onUpdate?: (updatedSite: Site) => void; onDelete?: (id: string) => void }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [glarePosition, setGlarePosition] = useState({ x: 0, y: 0, opacity: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [iconUrl, setIconUrl] = useState(site.icon || `https://www.google.com/s2/favicons?domain=${site.url}&sz=64`);

    // 当 site.icon 或 site.url 改变时，更新 iconUrl
    useEffect(() => {
        setIconUrl(site.icon || `https://www.google.com/s2/favicons?domain=${site.url}&sz=64`);
    }, [site.icon, site.url]);

    const handleIconError = () => {
        const googleFavicon = `https://www.google.com/s2/favicons?domain=${site.url}&sz=64`;
        const fallbackFavicon = `https://api.iowen.cn/favicon/${new URL(site.url).hostname}.png`;

        if (iconUrl !== googleFavicon) {
            // 如果是自定义图标失败，先尝试 Google
            setIconUrl(googleFavicon);
        } else if (iconUrl !== fallbackFavicon) {
            // 如果 Google 也失败，尝试备用 API
            setIconUrl(fallbackFavicon);
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
        const rotateX = ((y - centerY) / centerY) * 15;
        const rotateY = ((x - centerX) / centerX) * -15;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;

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
            alert('删除失败，请重试');
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
                className="card-glow group relative flex flex-col gap-3 p-4 rounded-xl transition-all duration-150 ease-out"
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
                    className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, var(--color-glare) 0%, transparent 100%)`,
                        opacity: glarePosition.opacity,
                        mixBlendMode: 'screen',
                        zIndex: 100,
                        transform: 'translateZ(30px)'
                    }}
                />


                {/* 操作按钮组 - 统一分组样式 */}
                <div
                    className="absolute top-2 right-2 flex items-center opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg overflow-hidden"
                    style={{
                        zIndex: 50,
                        transform: 'translateZ(30px)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-md)'
                    }}
                >
                    <button
                        onClick={handleEditClick}
                        className="p-1.5 transition-all hover:bg-[var(--color-bg-tertiary)] flex items-center justify-center"
                        title="编辑站点"
                    >
                        <Edit size={14} style={{ color: 'var(--color-text-secondary)' }} />
                    </button>

                    {/* 分割线 */}
                    <div className="w-[1px] h-3 bg-[var(--color-border)] shrink-0" />

                    <button
                        onClick={handleDeleteClick}
                        className="p-1.5 transition-all hover:bg-red-500/10 flex items-center justify-center"
                        title="删除站点"
                    >
                        <Trash2 size={14} className="text-red-500 opacity-70 hover:opacity-100" />
                    </button>
                </div>

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
                            <img
                                src={iconUrl}
                                alt={site.title}
                                className="w-full h-full object-contain"
                                onError={handleIconError}
                            />
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-1.5">
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
                            <ExternalLink
                                className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-0.5 group-hover:translate-y-0 shrink-0"
                                style={{ color: 'var(--color-accent)' }}
                            />
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
                        backgroundColor: '#1a1a1a',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                >
                    {site.url}
                    {/* 小箭头 - 指向上方 */}
                    <div
                        className="absolute"
                        style={{
                            top: '-4px',
                            left: '50%',
                            marginLeft: '-4px',
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#1a1a1a',
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
                message={`确定要删除站点 “${site.title}” 吗？删除后将无法恢复。`}
                confirmText="删除"
                type="danger"
            />
        </div>
    );
}
