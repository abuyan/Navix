'use client';

import { useState, useEffect, Suspense } from 'react';
import { useToast } from '@/components/Toast';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import { Plus, Edit2, Trash2, Layout, ExternalLink, ArrowLeft, ChevronUp, ChevronDown, Cpu, Save, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import PanelModal from '@/components/PanelModal';
import { ConfirmModal } from '@/components/ConfirmModal';

import AIModelModal, { AIModelConfig } from '@/components/AIModelModal';
import { Power } from 'lucide-react';

function SettingsContent() {
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get('tab') || 'panels';

    const [panels, setPanels] = useState<any[]>([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Panel Modal States
    const [isPanelModalOpen, setIsPanelModalOpen] = useState(false);
    const [selectedPanel, setSelectedPanel] = useState<any>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [panelToDelete, setPanelToDelete] = useState<any>(null);

    // AI Configuration States
    const [aiModels, setAiModels] = useState<AIModelConfig[]>([]);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [selectedAIModel, setSelectedAIModel] = useState<AIModelConfig | null>(null);
    const [activeAIModelId, setActiveAIModelId] = useState<string | null>(null);

    useEffect(() => {
        fetchPanels();
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await fetch('/api/settings/configs');
            if (res.ok) {
                const data = await res.json();

                // Parse AI Models List
                let models: AIModelConfig[] = [];
                if (data.AI_MODELS_LIST) {
                    try {
                        models = JSON.parse(data.AI_MODELS_LIST);
                    } catch (e) {
                        console.error("Failed to parse AI_MODELS_LIST", e);
                    }
                }

                // Initial Migration or Fallback: If no list but we have legacy config
                if (models.length === 0 && data.AI_MODEL) {
                    const legacyModel: AIModelConfig = {
                        id: 'legacy-default',
                        name: '默认模型',
                        model: data.AI_MODEL,
                        baseUrl: data.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
                        apiKey: data.AI_API_KEY || '',
                        isActive: true
                    };
                    models = [legacyModel];
                }

                setAiModels(models);

                // Identify active model
                const active = models.find(m => m.isActive);
                if (active) setActiveAIModelId(active.id);
            }
        } catch (err) {
            console.error('Failed to fetch configs:', err);
        }
    };

    const saveAIConfigs = async (newModels: AIModelConfig[]) => {
        const activeModel = newModels.find(m => m.isActive);

        try {
            const payload = {
                configs: {
                    AI_MODELS_LIST: JSON.stringify(newModels),
                    // Sync active model for backend usage
                    AI_MODEL: activeModel?.model || '',
                    AI_BASE_URL: activeModel?.baseUrl || '',
                    AI_API_KEY: activeModel?.apiKey || ''
                }
            };

            const res = await fetch('/api/settings/configs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setAiModels(newModels);
                if (activeModel) setActiveAIModelId(activeModel.id);
                else setActiveAIModelId(null);
                showToast('AI 配置已保存', 'success');
            } else {
                const errorData = await res.json();
                showToast(errorData.error || '保存失败', 'error');
            }
        } catch (err) {
            console.error('Failed to save AI configs:', err);
            showToast('保存失败', 'error');
        }
    };

    const handleSaveAIModel = (model: AIModelConfig) => {
        let newModels = [...aiModels];
        const index = newModels.findIndex(m => m.id === model.id);

        if (index >= 0) {
            newModels[index] = model;
        } else {
            // New model: if it's the first one, make it active by default
            if (newModels.length === 0) model.isActive = true;
            newModels.push(model);
        }

        // If the saved model is set to active, deactivate others
        if (model.isActive) {
            newModels = newModels.map(m => ({
                ...m,
                isActive: m.id === model.id
            }));
        }

        saveAIConfigs(newModels);
    };

    const toggleAIModel = (id: string) => {
        const newModels = aiModels.map(m => ({
            ...m,
            isActive: m.id === id ? !m.isActive : false // Toggle target, ensure others are off (single active) or allow turning off all?
            // User requested "enable switch", implying purely "which one is active". 
            // Usually we want at least one active, or none. Let's allow toggling OFF active one to disable AI features.
        }));

        // Special logic: If we are turning ON a model, ensure others are OFF (handled above).

        saveAIConfigs(newModels);
    };

    const handleDeleteAIModel = (id: string) => {
        if (confirm('确定要删除这个模型配置吗？')) {
            const newModels = aiModels.filter(m => m.id !== id);
            saveAIConfigs(newModels);
        }
    };

    const handleCreateAIModel = () => {
        setSelectedAIModel(null);
        setIsAIModalOpen(true);
    };

    const handleEditAIModel = (model: AIModelConfig) => {
        setSelectedAIModel(model);
        setIsAIModalOpen(true);
    };

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
        setIsPanelModalOpen(true);
    };

    const handleEditPanel = (panel: any) => {
        setSelectedPanel(panel);
        setIsPanelModalOpen(true);
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
                showToast(data.error || '删除失败', 'error');
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

    const setTab = (tab: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`/settings?${params.toString()}`);
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

                <main className="flex-1 p-6 md:px-10 md:pb-10 md:pt-24 max-w-4xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">系统设置</h1>
                        </div>
                    </div>

                    {/* Tab 切换逻辑 */}
                    <div className="flex items-center gap-2 mb-6 p-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg w-fit">
                        <button
                            onClick={() => setTab('panels')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'panels'
                                ? 'bg-[var(--color-bg-primary)] shadow-sm text-[var(--color-accent)]'
                                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Layout size={14} />
                                导航管理
                            </div>
                        </button>
                        <button
                            onClick={() => setTab('ai')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'ai'
                                ? 'bg-[var(--color-bg-primary)] shadow-sm text-[var(--color-accent)]'
                                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Cpu size={14} />
                                AI 配置
                            </div>
                        </button>
                    </div>

                    <div className="space-y-6">
                        {activeTab === 'panels' && (
                            <>
                                <section className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)] flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <h2 className="font-bold">导航版块管理</h2>
                                        </div>
                                        <button
                                            onClick={handleCreatePanel}
                                            className="btn-new-category group flex items-center gap-2 px-4 h-9 rounded-lg font-medium transition-all text-sm border hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <Plus size={16} />
                                            <span>新增版块</span>
                                        </button>
                                    </div>

                                    <div className="divide-y divide-[var(--color-border)]">
                                        {panels.map((panel, index) => (
                                            <div key={panel.id} className="p-6 transition-colors hover:bg-[var(--color-bg-tertiary)]">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-secondary)]">
                                                            <Layout size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold flex items-center gap-2">
                                                                {panel.name}
                                                                <span className="text-[var(--color-text-tertiary)] font-normal text-xs px-2 py-0.5 bg-[var(--color-bg-tertiary)] rounded-full">
                                                                    /{panel.slug || panel.id}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                                                {panel.description || `创建于 ${new Date(panel.createdAt).toLocaleDateString()}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={panel.slug === 'home' ? '/' : `/p/${panel.slug || panel.id}`}
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
                                                            className="p-2 rounded-lg hover:bg-[var(--color-bg-primary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                                                            title="删除"
                                                            disabled={panel.slug === 'home'}
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

                                <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg p-4 flex gap-3 text-sm text-[var(--color-text-secondary)]">
                                    <Plus size={18} className="flex-shrink-0" />
                                    <p>
                                        <strong>提示：</strong> 您可以点击“新增版块”来创建顶部的不同导航视图。第一个版块通常是您的主页。
                                    </p>
                                </div>
                            </>
                        )}

                        {activeTab === 'ai' && (
                            <>
                                <section className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)] flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <h2 className="font-bold">AI 识别配置</h2>
                                        </div>
                                        <button
                                            onClick={handleCreateAIModel}
                                            className="btn-new-category group flex items-center gap-2 px-4 h-9 rounded-lg font-medium transition-all text-sm border hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <Plus size={16} />
                                            <span>添加 AI 模型</span>
                                        </button>
                                    </div>

                                    <div className="divide-y divide-[var(--color-border)]">
                                        {aiModels.map(model => (
                                            <div key={model.id} className="p-6 transition-all hover:bg-[var(--color-bg-tertiary)]">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--color-bg-tertiary)] ${model.isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                                                            <Cpu size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold flex items-center gap-2">
                                                                {model.name}
                                                            </div>
                                                            <div className="flex items-center gap-4 mt-1 text-sm text-[var(--color-text-secondary)]">
                                                                <span className="font-mono bg-[var(--color-bg-tertiary)] px-1.5 rounded text-xs">{model.model}</span>
                                                                <span className="text-[var(--color-text-tertiary)] truncate max-w-[200px]">{model.baseUrl}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2" title="启用此模型">
                                                            <span className={`text-sm ${model.isActive ? 'text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-tertiary)]'}`}>
                                                                {model.isActive ? '已开启' : '未开启'}
                                                            </span>
                                                            <button
                                                                onClick={() => !model.isActive && toggleAIModel(model.id)}
                                                                className={`w-10 h-6 rounded-full transition-colors relative ${model.isActive ? 'bg-[var(--color-text-secondary)] cursor-default' : 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-hover)] cursor-pointer'}`}
                                                            >
                                                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${model.isActive ? 'translate-x-4 bg-white' : 'translate-x-0 bg-[var(--color-text-tertiary)]'}`} />
                                                            </button>
                                                        </div>

                                                        <div className="w-px h-6 bg-[var(--color-border)] mx-2"></div>

                                                        <button
                                                            onClick={() => handleEditAIModel(model)}
                                                            className="p-2 rounded-lg hover:bg-[var(--color-bg-primary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                                                            title="编辑"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAIModel(model.id)}
                                                            className="p-2 rounded-lg hover:bg-[var(--color-bg-primary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                                                            title="删除"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {aiModels.length === 0 && (
                                            <div className="p-10 text-center text-[var(--color-text-tertiary)]">
                                                暂无 AI 模型，请点击右上角添加。
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <div className="mt-6 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg p-4 flex gap-3 text-sm text-[var(--color-text-secondary)]">
                                    <Cpu size={18} className="flex-shrink-0 mt-0.5" />
                                    <p>
                                        <strong>说明：</strong> 启用后的模型将用于自动识别站点的标题、描述和分类。建议使用各大模型厂商的 API (如智谱、DeepSeek、OpenAI)。
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>

            {/* Panel Modals */}
            <PanelModal
                isOpen={isPanelModalOpen}
                onClose={() => setIsPanelModalOpen(false)}
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

            {/* AI Model Modal */}
            <AIModelModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onSave={handleSaveAIModel}
                model={selectedAIModel}
            />
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <SettingsContent />
        </Suspense>
    );
}
