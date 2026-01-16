'use client';

import { useState, useEffect, Suspense } from 'react';
import { useToast } from '@/components/Toast';
import TopNav from '@/components/TopNav';

import { Plus, Edit2, Trash2, Layout, ExternalLink, ArrowLeft, ChevronUp, ChevronDown, Cpu, Save, CheckCircle2, Settings, User, CreditCard, HardDrive, HelpCircle, Info, ChevronLeft, ChevronRight, LogOut, Globe, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import PanelModal from '@/components/PanelModal';
import { ConfirmModal } from '@/components/ConfirmModal';

import AIModelModal, { AIModelConfig } from '@/components/AIModelModal';
import { DynamicSlogan } from '@/components/DynamicSlogan';
import BackToTop from '@/components/BackToTop';
import { Power } from 'lucide-react';
import UpdatePasswordModal from '@/components/UpdatePasswordModal'; // Import Modal

import { useSession, signOut } from 'next-auth/react';

function SettingsContent() {
    const { data: session, status, update } = useSession();
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get('tab') || 'account';

    const [panels, setPanels] = useState<any[]>([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Restored
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        setOrigin(window.location.origin);
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);


    const [isPanelModalOpen, setIsPanelModalOpen] = useState(false);
    const [selectedPanel, setSelectedPanel] = useState<any>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [panelToDelete, setPanelToDelete] = useState<any>(null);

    // AI Configuration States
    const [aiModels, setAiModels] = useState<AIModelConfig[]>([]);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [selectedAIModel, setSelectedAIModel] = useState<AIModelConfig | null>(null);
    const [activeAIModelId, setActiveAIModelId] = useState<string | null>(null);
    const [deleteAIConfirmOpen, setDeleteAIConfirmOpen] = useState(false);
    const [aiModelToDelete, setAiModelToDelete] = useState<string | null>(null);

    // Profile Editing State
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);

    // Password Modal State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    // 监听窗口宽度，小于 1000px 自动收起侧边栏
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1000) {
                setSidebarCollapsed(true);
            }
        };

        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchPanels();
        fetchConfigs();
    }, []);

    useEffect(() => {
        if (session?.user?.name) {
            setNewName(session.user.name);
        }
    }, [session?.user?.name]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null; // Will redirect
    }

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

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast('图片大小不能超过 5MB', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/user/avatar', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                showToast('头像上传成功', 'success');
                await update({ image: data.url });
                router.refresh();
            } else {
                showToast('上传失败', 'error');
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            showToast('上传失败', 'error');
        }
    };

    const handleUpdateProfile = async () => {
        if (!newName.trim()) return;
        setIsSavingName(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                await res.json();
                showToast('昵称已更新', 'success');

                // Update session client-side
                await update({ name: newName });

                setIsEditingName(false);
                router.refresh();
            } else {
                const data = await res.json();
                showToast(data.error || '更新失败', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('更新失败', 'error');
        } finally {
            setIsSavingName(false);
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
        // 设置指定模型为默认使用的模型
        const newModels = aiModels.map(m => ({
            ...m,
            isActive: m.id === id
        }));
        saveAIConfigs(newModels);
    };

    const handleDeleteAIModel = (id: string) => {
        setAiModelToDelete(id);
        setDeleteAIConfirmOpen(true);
    };

    const confirmDeleteAIModel = () => {
        if (aiModelToDelete) {
            const newModels = aiModels.filter(m => m.id !== aiModelToDelete);
            saveAIConfigs(newModels);
            setAiModelToDelete(null);
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
            if (Array.isArray(data)) {
                setPanels(data);
            } else {
                console.warn('API returned non-array data:', data);
                setPanels([]);
            }
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

    const handleSharePanel = (panel: any) => {
        const url = panel.slug === 'home' ? '/' : `/p/${panel.slug || panel.id}`;
        // 获取完整 URL
        const fullUrl = `${window.location.origin}${url}`;

        // 复制到剪贴板
        navigator.clipboard.writeText(fullUrl).then(() => {
            showToast('链接已复制到剪贴板', 'success');
            router.push(url);
        }).catch(err => {
            console.error('Failed to copy link:', err);
            router.push(url);
        });
    };

    const setTab = (tab: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`/settings?${params.toString()}`);
    };

    // 设置导航菜单项
    const settingsMenuItems = [
        { id: 'account', label: '账户', icon: User, description: '个人资料管理' },
        { id: 'panels', label: '收藏夹', icon: Layout, description: '收藏夹管理' },
        { id: 'ai', label: 'AI 配置', icon: Cpu, description: 'AI 模型配置' },
        { id: 'subscription', label: '订阅', icon: CreditCard, badge: '即将推出' },
        { id: 'backup', label: '备份', icon: HardDrive, badge: '即将推出' },
        { id: 'help', label: '帮助', icon: HelpCircle, badge: '即将推出' },
        { id: 'about', label: '关于', icon: Info },
    ];

    return (
        <div className="flex min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
            {/* 设置专属侧边栏 */}
            <aside
                className={`h-screen fixed left-0 top-0 flex flex-col z-40 hidden md:flex transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}`}
                style={{
                    backgroundColor: 'var(--sidebar-bg)',
                    borderRight: '1px solid var(--sidebar-border)'
                }}
            >
                {/* Logo Area */}
                <div
                    className="h-16 flex items-center justify-center flex-shrink-0 transition-all duration-300"
                    style={{ borderBottom: '1px solid var(--sidebar-border)' }}
                >
                    <div
                        className="flex items-center w-full transition-all duration-300 ease-in-out"
                        style={{
                            paddingLeft: sidebarCollapsed ? '20px' : '24px',
                            paddingRight: sidebarCollapsed ? '20px' : '24px',
                            justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
                        }}
                    >
                        <img
                            src="/logo.svg"
                            alt="Nivix Logo"
                            className="w-8 h-8 rounded-lg flex-shrink-0 transition-all duration-300 logo-light"
                        />
                        <img
                            src="/logo-dark.svg"
                            alt="Nivix Logo"
                            className="w-8 h-8 rounded-lg flex-shrink-0 transition-all duration-300 logo-dark"
                        />
                        <div
                            className="flex flex-col ml-0 transition-all duration-300 ease-in-out"
                            style={{
                                opacity: sidebarCollapsed ? 0 : 1,
                                maxWidth: sidebarCollapsed ? '0px' : '200px',
                                marginLeft: sidebarCollapsed ? '0px' : '12px',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <span className="font-bold text-base tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Nivix 灵犀书签</span>
                            <DynamicSlogan />
                        </div>
                    </div>
                </div>

                {/* 设置导航菜单 */}
                <nav className={`flex-1 overflow-y-auto py-4 space-y-1 ${sidebarCollapsed ? 'px-3' : 'px-3'}`}>
                    {settingsMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => setTab(item.id)}
                                className="w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200"
                                style={{
                                    height: '38px',
                                    padding: sidebarCollapsed ? '0' : '0 12px',
                                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                    gap: sidebarCollapsed ? '0' : '12px',
                                    backgroundColor: isActive ? 'var(--color-accent-soft)' : 'transparent',
                                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)'
                                }}
                                title={sidebarCollapsed ? item.label : undefined}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <div
                                    className="flex items-center flex-1 min-w-0 transition-all duration-300 ease-in-out"
                                    style={{
                                        opacity: sidebarCollapsed ? 0 : 1,
                                        maxWidth: sidebarCollapsed ? '0px' : '200px',
                                        marginLeft: sidebarCollapsed ? '0px' : '12px',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {item.badge && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </nav>

                {/* 收起/展开按钮 */}
                <div
                    className="p-[3px] px-3 flex-shrink-0"
                    style={{ borderTop: '1px solid var(--sidebar-border)' }}
                >
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        title={sidebarCollapsed ? '展开菜单' : '收起菜单'}
                        className="w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[var(--color-bg-tertiary)]"
                        style={{
                            height: '38px',
                            padding: sidebarCollapsed ? '0' : '0 12px',
                            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                            gap: sidebarCollapsed ? '0' : '12px',
                            color: 'var(--color-text-tertiary)'
                        }}
                    >
                        {sidebarCollapsed ? (
                            <div className="flex items-center justify-center w-full">
                                <ChevronRight className="w-5 h-5 flex-shrink-0" />
                            </div>
                        ) : (
                            <div
                                className="flex items-center transition-all duration-300 ease-in-out"
                                style={{
                                    opacity: sidebarCollapsed ? 0 : 1,
                                    maxWidth: sidebarCollapsed ? '0px' : '150px',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <ChevronLeft className="w-5 h-5 flex-shrink-0 mr-3" />
                                <span>收起菜单</span>
                            </div>
                        )}
                    </button>
                </div>
            </aside>

            <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64'}`}>
                <div className="flex-none z-30 bg-[var(--color-bg-primary)]">
                    <TopNav sidebarCollapsed={sidebarCollapsed} panels={panels} user={session?.user} authStatus={status} />
                </div>

                <main className="flex-1 overflow-y-auto w-full">
                    <div className="max-w-4xl mx-auto p-6 md:px-10 md:pb-10">
                        <div className="py-8 space-y-6">
                            {activeTab === 'panels' && (
                                <>
                                    {/* 收藏夹管理 */}
                                    <section className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] overflow-hidden">
                                        <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)] flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <h2 className="font-bold">收藏夹管理</h2>
                                            </div>
                                            <button
                                                onClick={handleCreatePanel}
                                                className="btn-new-category group flex items-center gap-2 px-4 h-9 rounded-lg font-medium transition-all text-sm border hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <Plus size={16} />
                                                <span>新增收藏夹</span>
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
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${panel.isPublic ? 'bg-green-500/10 text-green-500' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'}`}>
                                                                        {panel.isPublic ? '已共享' : '私有'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                                                    {panel.description || `创建于 ${new Date(panel.createdAt).toLocaleDateString()}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleSharePanel(panel)}
                                                                className="p-2 rounded-lg hover:bg-[var(--color-bg-primary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                                                                title="分享并查看"
                                                            >
                                                                <ExternalLink size={18} />
                                                            </button>
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
                                </>
                            )}

                            {/* AI 配置 */}
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
                                                            {/* 当前使用标签或设为默认按钮 */}
                                                            {model.isActive ? (
                                                                <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
                                                                    当前使用
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => toggleAIModel(model.id)}
                                                                    className="text-xs px-3 py-1 rounded-full border transition-colors hover:bg-[var(--color-bg-tertiary)]"
                                                                    style={{
                                                                        borderColor: 'var(--color-border)',
                                                                        color: 'var(--color-text-secondary)'
                                                                    }}
                                                                >
                                                                    设为默认
                                                                </button>
                                                            )}

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
                                            <strong>说明：</strong> 启用后的模型将用于自动识别网页的标题、描述和分类。建议使用各大模型厂商的 API (如智谱、DeepSeek、OpenAI)。
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* 账户设置 */}
                            {activeTab === 'account' && (
                                <>


                                    <section className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] overflow-hidden mb-6">
                                        <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)] flex items-center justify-between">
                                            <h2 className="font-bold">账户信息</h2>
                                            <button
                                                onClick={() => setIsPasswordModalOpen(true)}
                                                className="px-4 py-2 rounded-lg bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-sm font-medium hover:opacity-90 transition-opacity"
                                            >
                                                修改密码
                                            </button>
                                        </div>
                                        <div className="p-6 space-y-6">
                                            <div className="flex items-center gap-6">
                                                <div
                                                    className="w-20 h-20 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity relative group overflow-hidden"
                                                    style={{ color: 'var(--color-text-secondary)' }}
                                                    onClick={() => document.getElementById('avatar-upload')?.click()}
                                                >
                                                    {session?.user?.image ? (
                                                        <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || 'U'
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Edit2 size={16} className="text-white" />
                                                    </div>
                                                </div>
                                                <input
                                                    type="file"
                                                    id="avatar-upload"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleAvatarUpload}
                                                />
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold">{session?.user?.name || '用户'}</h3>
                                                    <p className="text-sm text-[var(--color-text-secondary)]">{session?.user?.email}</p>
                                                </div>
                                            </div>

                                            <div className="grid gap-6">
                                                {/* 昵称编辑 */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>昵称</label>
                                                        {!isEditingName && (
                                                            <button
                                                                onClick={() => setIsEditingName(true)}
                                                                className="text-xs text-[var(--color-primary)] hover:underline"
                                                            >
                                                                修改
                                                            </button>
                                                        )}
                                                    </div>
                                                    {isEditingName ? (
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={newName}
                                                                onChange={(e) => setNewName(e.target.value)}
                                                                className="flex-1 px-4 h-10 rounded-lg border outline-none text-sm bg-[var(--color-bg-primary)] border-[var(--color-border)] focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
                                                                placeholder="输入新昵称"
                                                            />
                                                            <button
                                                                onClick={handleUpdateProfile}
                                                                disabled={isSavingName}
                                                                className="px-4 h-10 rounded-lg bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-sm font-medium hover:opacity-90 disabled:opacity-50"
                                                            >
                                                                {isSavingName ? '保存中...' : '保存'}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setIsEditingName(false);
                                                                    setNewName(session?.user?.name || '');
                                                                }}
                                                                className="px-4 h-10 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm font-medium hover:bg-[var(--color-bg-tertiary)]"
                                                            >
                                                                取消
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full px-4 h-10 rounded-lg border flex items-center text-sm bg-[var(--color-bg-tertiary)] border-[var(--color-border)] text-[var(--color-text-primary)]">
                                                            {session?.user?.name || '未设置'}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 用户 ID (只读) */}
                                                <div>
                                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>用户 ID (唯一标识)</label>
                                                    <div className="w-full px-4 h-10 rounded-lg border flex items-center text-sm bg-[var(--color-bg-tertiary)] border-[var(--color-border)] text-[var(--color-text-secondary)]">
                                                        {/* @ts-ignore */}
                                                        {session?.user?.username || '未设置'}
                                                    </div>
                                                </div>

                                                {/* 邮箱 (只读) */}
                                                <div>
                                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>邮箱</label>
                                                    <div className="w-full px-4 h-10 rounded-lg border flex items-center text-sm bg-[var(--color-bg-tertiary)] border-[var(--color-border)] text-[var(--color-text-secondary)]">
                                                        {session?.user?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-5 mb-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h4 className="font-semibold mb-1 flex items-center gap-2">
                                                    <Globe size={16} />
                                                    个人主页
                                                </h4>
                                                <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                                                    这是您的公开主页，包含所有设置为“公开”的收藏夹。您可以将此链接分享给朋友。
                                                </p>
                                                <div className="flex items-center gap-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-text-secondary)] font-mono break-all">
                                                    <span className="truncate">{origin}/u/{session?.user?.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mt-4">
                                            <button
                                                onClick={() => {
                                                    const url = `${origin}/u/${session?.user?.name}`;
                                                    navigator.clipboard.writeText(url);
                                                    showToast('主页链接已复制', 'success');
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-sm font-medium hover:opacity-90 transition-opacity"
                                            >
                                                <LinkIcon size={16} />
                                                复制链接
                                            </button>
                                            <a
                                                href={`/u/${session?.user?.name}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-medium hover:bg-[var(--color-bg-primary)] transition-colors"
                                            >
                                                <ExternalLink size={16} />
                                                访问主页
                                            </a>
                                        </div>
                                    </div>

                                    {/* 安全设置 */}


                                    <UpdatePasswordModal
                                        isOpen={isPasswordModalOpen}
                                        onClose={() => setIsPasswordModalOpen(false)}
                                    />


                                </>
                            )}

                            {/* 订阅 */}
                            {activeTab === 'subscription' && (
                                <section className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
                                        <h2 className="font-bold">订阅计划</h2>
                                    </div>
                                    <div className="p-10 text-center">
                                        <CreditCard size={48} className="mx-auto mb-4 text-[var(--color-text-tertiary)]" />
                                        <h3 className="text-lg font-semibold mb-2">订阅功能即将推出</h3>
                                        <p className="text-sm text-[var(--color-text-secondary)]">
                                            我们正在努力开发订阅功能，敬请期待更多高级功能。
                                        </p>
                                    </div>
                                </section>
                            )}

                            {/* 备份 */}
                            {activeTab === 'backup' && (
                                <section className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
                                        <h2 className="font-bold">数据备份</h2>
                                    </div>
                                    <div className="p-10 text-center">
                                        <HardDrive size={48} className="mx-auto mb-4 text-[var(--color-text-tertiary)]" />
                                        <h3 className="text-lg font-semibold mb-2">备份功能即将推出</h3>
                                        <p className="text-sm text-[var(--color-text-secondary)]">
                                            我们正在开发数据备份与恢复功能，让您的数据更加安全。
                                        </p>
                                    </div>
                                </section>
                            )}

                            {/* 帮助 */}
                            {activeTab === 'help' && (
                                <section className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
                                        <h2 className="font-bold">帮助中心</h2>
                                    </div>
                                    <div className="p-10 text-center">
                                        <HelpCircle size={48} className="mx-auto mb-4 text-[var(--color-text-tertiary)]" />
                                        <h3 className="text-lg font-semibold mb-2">帮助文档即将推出</h3>
                                        <p className="text-sm text-[var(--color-text-secondary)]">
                                            我们正在编写详细的使用指南和常见问题解答，敬请期待。
                                        </p>
                                    </div>
                                </section>
                            )}

                            {/* 关于 */}
                            {activeTab === 'about' && (
                                <section className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
                                        <h2 className="font-bold">关于 Nivix</h2>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden">
                                                <img src="/logo.svg" alt="Nivix" className="w-full h-full object-cover dark:hidden" />
                                                <img src="/logo-dark.svg" alt="Nivix" className="w-full h-full object-cover hidden dark:block" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold flex items-center gap-2">
                                                    Nivix 灵犀书签
                                                </h3>
                                                <p className="text-sm text-[var(--color-text-secondary)]">AI 驱动的智能书签管理工具</p>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[var(--color-text-secondary)]">版本</span>
                                                <span className="font-mono">0.10.1</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[var(--color-text-secondary)]">开发者</span>
                                                <span>阿布</span>
                                            </div>
                                        </div>

                                        <p className="text-sm text-[var(--color-text-secondary)] pt-4 border-t border-[var(--color-border)] leading-relaxed">
                                            Nivix 是一款基于 AI 技术的智能书签管理工具，帮助您更高效地收藏、整理和发现优质网站。
                                            <br /><br />
                                            "心有灵犀，藏而有序"。Nivix 不仅仅是一个书签夹，更是您的智能第二大脑。通过 AI 自动分类、智能图标匹配和语义搜索，让每一次收藏都井井有条，每一次查找都得心应手。
                                        </p>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            <BackToTop />

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
                title="删除收藏夹"
                message="确定要删除这个收藏夹吗？这将不会删除其中的分类，但会导致分类失去所属收藏夹。建议先手动转移分类。"
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

            <ConfirmModal
                isOpen={deleteAIConfirmOpen}
                onClose={() => setDeleteAIConfirmOpen(false)}
                onConfirm={confirmDeleteAIModel}
                title="删除 AI 模型"
                message="确定要删除这个模型配置吗？删除后将无法恢复。"
                confirmText="删除"
                cancelText="取消"
                type="danger"
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
