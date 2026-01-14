'use client';

import { useState, useEffect } from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import { Plus, Edit2, Trash2, Layout, ExternalLink, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import PanelModal from '@/components/PanelModal';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function SettingsPage() {
    const [panels, setPanels] = useState<any[]>([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPanel, setSelectedPanel] = useState<any>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [panelToDelete, setPanelToDelete] = useState<any>(null);

    useEffect(() => {
        fetchPanels();
    }, []);

    const fetchPanels = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/panels');
            const data = await res.json();
            setPanels(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePanel = () => {
        setSelectedPanel(null);
        setIsModalOpen(true);
    };

    const handleEditPanel = (panel: any) => {
        setSelectedPanel(panel);
        setIsModalOpen(true);
    };

    const handleDeletePanel = async (id: string) => {
        try {
            const res = await fetch(`/api/panels/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchPanels();
            } else {
                const data = await res.json();
                alert(data.error || '删除失败');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const confirmDeletePanel = (panel: any) => {
        setPanelToDelete(panel);
        setDeleteConfirmOpen(true);
    };

    const movePanel = async (index: number, direction: 'up' | 'down') => {
        const newPanels = [...panels];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newPanels.length) return;

        // 交换位置
        [newPanels[index], newPanels[targetIndex]] = [newPanels[targetIndex], newPanels[index]];

        // 重新设置 sortOrder
        const reorderedPanels = newPanels.map((p, i) => ({ id: p.id, sortOrder: i }));

        // 乐观更新 UI
        setPanels(newPanels);

        try {
            await fetch('/api/panels/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ panels: reorderedPanels })
            });
        } catch (err) {
            console.error(err);
            // 失败时恢复
            fetchPanels();
        }
    };

    return (
        <div className="flex min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
            <Sidebar
                categories={[]}
                activeCategory=""
                onCategoryChange={() => { }}
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex"
            />

            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64'}`}>
                <TopNav sidebarCollapsed={sidebarCollapsed} panels={panels} />

                <main className="flex-1 p-6 md:px-10 md:pb-10 md:pt-32 max-w-4xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] mb-2 transition-colors"
                            >
                                <ArrowLeft size={14} />
                                返回首页
                            </Link>
                            <h1 className="text-3xl font-bold">系统设置</h1>
                            <p className="text-[var(--color-text-secondary)] mt-1">管理您的导航版块和系统配置</p>
                        </div>
                        <button
                            onClick={handleCreatePanel}
                            className="btn-new-category group flex items-center gap-2 px-4 h-9 rounded-lg font-medium transition-all text-sm border hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus size={16} />
                            <span>新增版块</span>
                        </button>
                    </div>

                    <div className="space-y-6">
                        <section className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
                            <div className="px-6 py-4 border-bottom border-[var(--color-border)] bg-[var(--color-bg-tertiary)] flex items-center gap-2">
                                <Layout size={18} className="text-[var(--color-text-secondary)]" />
                                <h2 className="font-bold">导航版块管理</h2>
                            </div>

                            <div className="divide-y divide-[var(--color-border)]">
                                {panels.map((panel, index) => (
                                    <div key={panel.id} className="p-6 transition-colors hover:bg-[var(--color-bg-tertiary)]">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-secondary)]">
                                                    <Layout size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold flex items-center gap-2">
                                                        {panel.name}
                                                        <span className="text-[var(--color-text-tertiary)] font-normal text-xs px-2 py-0.5 bg-[var(--color-bg-tertiary)] rounded-full">
                                                            /{panel.slug || panel.id}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-[var(--color-text-secondary)]">
                                                        创建于 {new Date(panel.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={panel.slug === 'nav' ? '/' : `/p/${panel.slug || panel.id}`}
                                                    className="p-2 rounded-lg hover:bg-[var(--color-bg-primary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                                                    title="查看"
                                                >
                                                    <ExternalLink size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => movePanel(index, 'up')}
                                                    className="p-2 rounded-lg hover:bg-[var(--color-bg-primary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="上移"
                                                    disabled={index === 0}
                                                >
                                                    <ChevronUp size={18} />
                                                </button>
                                                <button
                                                    onClick={() => movePanel(index, 'down')}
                                                    className="p-2 rounded-lg hover:bg-[var(--color-bg-primary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="下移"
                                                    disabled={index === panels.length - 1}
                                                >
                                                    <ChevronDown size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEditPanel(panel)}
                                                    className="p-2 rounded-lg hover:bg-[var(--color-bg-primary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                                                    title="编辑"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => confirmDeletePanel(panel)}
                                                    className="p-2 rounded-lg hover:bg-[var(--color-bg-primary)] text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors"
                                                    title="删除"
                                                    disabled={panel.slug === 'nav'}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="p-10 text-center text-[var(--color-text-tertiary)]">
                                        加载中...
                                    </div>
                                )}
                                {!isLoading && panels.length === 0 && (
                                    <div className="p-10 text-center text-[var(--color-text-tertiary)]">
                                        暂无版块
                                    </div>
                                )}
                            </div>
                        </section>

                        <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl p-4 flex gap-3 text-sm text-[var(--color-text-secondary)]">
                            <Plus size={18} className="flex-shrink-0" />
                            <p>
                                <strong>提示：</strong> 您可以点击“新增版块”来创建顶部的不同导航视图。第一个版块通常是您的主页。
                            </p>
                        </div>
                    </div>
                </main>
            </div>

            <PanelModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchPanels}
                panel={selectedPanel}
            />

            <ConfirmModal
                isOpen={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={() => {
                    if (panelToDelete) {
                        handleDeletePanel(panelToDelete.id);
                    }
                }}
                title="删除版块"
                message="确定要删除这个版块吗？这将不会删除其中的分类，但会导致分类失去所属版块。建议先手动转移分类。"
                confirmText="删除"
                cancelText="取消"
                type="danger"
            />
        </div>
    );
}
