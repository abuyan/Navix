'use client';

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Site } from '@prisma/client';
import { useToast } from '@/components/Toast';

interface BatchAIContextType {
    isBatchAnalyzing: boolean;
    batchProgress: string;
    startBatchAnalysis: (sites: Site[]) => Promise<void>;
    startBatchCategorization: (sites: Site[], categories: { id: string, name: string }[]) => Promise<void>;
    startBatchIconGeneration: (categories: { id: string, name: string }[]) => Promise<void>;
    stopBatchAnalysis: () => void;
    subscribe: (callback: (updatedSite: any) => void) => () => void;
}

const BatchAIContext = createContext<BatchAIContextType | undefined>(undefined);

export function BatchAIProvider({ children }: { children: React.ReactNode }) {
    const { showToast } = useToast();
    const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
    const [batchProgress, setBatchProgress] = useState('');
    const shouldStopRef = useRef(false);
    const listenersRef = useRef<((updatedSite: any) => void)[]>([]);

    const subscribe = useCallback((callback: (updatedSite: any) => void) => {
        listenersRef.current.push(callback);
        return () => {
            listenersRef.current = listenersRef.current.filter(cb => cb !== callback);
        };
    }, []);

    const notifyListeners = useCallback((updatedSite: any) => {
        listenersRef.current.forEach(callback => callback(updatedSite));
    }, []);

    const startBatchAnalysis = useCallback(async (sites: Site[]) => {
        if (isBatchAnalyzing) return;

        // Filter out sites that have already been analyzed
        const pendingSites = sites.filter(site => !site.aiAnalyzed);

        if (pendingSites.length === 0) {
            setBatchProgress('无需整理');
            setTimeout(() => setBatchProgress(''), 3000);
            return;
        }

        setIsBatchAnalyzing(true);
        shouldStopRef.current = false;
        setBatchProgress(`0/${pendingSites.length}`);

        let successCount = 0;
        let failCount = 0;

        try {
            for (let i = 0; i < pendingSites.length; i++) {
                if (shouldStopRef.current) break;

                const site = pendingSites[i];
                setBatchProgress(`正在整理: ${site.title}`);

                try {
                    // 1. AI Extract
                    const extractRes = await fetch('/api/ai/extract', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            url: site.url,
                            title: site.title,
                            description: site.description
                        })
                    });

                    if (!extractRes.ok) {
                        let errorMsg = 'AI 请求失败';
                        try {
                            const errData = await extractRes.json();
                            errorMsg = errData.error || errorMsg;
                        } catch (e) { /* ignore JSON parse error */ }

                        if (extractRes.status === 401 || extractRes.status === 500) {
                            // If 500, it might be an API Key error wrapped by backend
                            console.warn('AI API Error (Handled):', errorMsg);

                            let displayMsg = 'AI 服务异常';
                            if (errorMsg.includes('401') || errorMsg.includes('Key') || errorMsg.includes('token')) {
                                displayMsg = '认证失败: API Key 无效';
                            }

                            setBatchProgress(displayMsg);
                            showToast(displayMsg, 'error');
                            shouldStopRef.current = true;
                            throw new Error('CONFIG_ERROR');
                        }
                        throw new Error(errorMsg);
                    }
                    const extractData = await extractRes.json();

                    // 2. Update Site with aiAnalyzed=true
                    console.log(`Updating site ${site.id} with AI data...`);
                    const updateRes = await fetch(`/api/sites/${site.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: extractData.title,
                            description: extractData.description,
                            icon: extractData.icon,
                            aiAnalyzed: true
                        })
                    });

                    if (!updateRes.ok) {
                        const errorText = await updateRes.text();
                        throw new Error(`Update failed: ${errorText}`);
                    }
                    const updatedSite = await updateRes.json();

                    notifyListeners(updatedSite);
                    successCount++;
                } catch (err: any) {
                    if (err.message === 'CONFIG_ERROR' || err.message === 'AUTH_ERROR') {
                        break; // Stop loop immediately
                    }
                    console.error(`Failed to analyze site ${site.id}:`, err);
                    failCount++;
                }
            }
        } catch (error) {
            console.error('Batch AI Analyze error:', error);
        } finally {
            setIsBatchAnalyzing(false);
            // Delay clearing progress so user can see completion
            setTimeout(() => setBatchProgress(''), 2000);
        }
    }, [isBatchAnalyzing, notifyListeners]);

    const startBatchCategorization = useCallback(async (sites: Site[], categories: { id: string, name: string }[]) => {
        if (isBatchAnalyzing) return;

        if (sites.length === 0) {
            showToast('没有可整理的书签', 'info');
            return;
        }

        setIsBatchAnalyzing(true);
        shouldStopRef.current = false;
        setBatchProgress(`正在分析 ${sites.length} 个书签...`);

        try {
            const response = await fetch('/api/ai/categorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sites: sites.map(s => ({ id: s.id, title: s.title, description: s.description })),
                    categories
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'AI 请求失败');
            }

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let processedCount = 0;

            while (true) {
                if (shouldStopRef.current) break;
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    // 清理 Markdown 代码块标记，增强容错
                    const cleanLine = line.replace(/```json/g, '').replace(/```/g, '').trim();
                    if (cleanLine) {
                        try {
                            const result = JSON.parse(cleanLine);
                            if (result.siteId && result.categoryId) {
                                const site = sites.find(s => s.id === result.siteId);
                                if (site) {
                                    setBatchProgress(`正在整理: ${site.title}`);

                                    // Robust ID Resolution: Check if AI returned a name instead of ID
                                    let targetCategoryId = result.categoryId;
                                    const categoryByName = categories.find(c => c.name === result.categoryId);
                                    if (categoryByName) {
                                        targetCategoryId = categoryByName.id;
                                    }

                                    if (site.categoryId !== targetCategoryId) {
                                        await fetch(`/api/sites/${result.siteId}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ categoryId: targetCategoryId })
                                        });

                                        notifyListeners({ id: result.siteId, categoryId: targetCategoryId });
                                        processedCount++;
                                    }
                                }
                            }
                        } catch (e) {
                            // ignore parse error
                        }
                    }
                }
            }

            if (buffer.trim()) {
                const cleanLine = buffer.replace(/```json/g, '').replace(/```/g, '').trim();
                try {
                    const result = JSON.parse(cleanLine);
                    if (result.siteId && result.categoryId) {
                        const site = sites.find(s => s.id === result.siteId);
                        if (site) {
                            setBatchProgress(`正在整理: ${site.title}`);

                            // Robust ID Resolution
                            let targetCategoryId = result.categoryId;
                            const categoryByName = categories.find(c => c.name === result.categoryId);
                            if (categoryByName) {
                                targetCategoryId = categoryByName.id;
                            }

                            if (site.categoryId !== targetCategoryId) {
                                await fetch(`/api/sites/${result.siteId}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ categoryId: targetCategoryId })
                                });
                                notifyListeners({ id: result.siteId, categoryId: targetCategoryId });
                                processedCount++;
                            }
                        }
                    }
                } catch (e) { }
            }

            if (processedCount > 0) {
                showToast(`成功整理了 ${processedCount} 个书签`, 'success');
            } else {
                showToast('书签分类已是最佳状态', 'success');
            }

        } catch (error) {
            console.error('Batch Categorize error:', error);
            showToast('AI 整理失败', 'error');
        } finally {
            setIsBatchAnalyzing(false);
            setBatchProgress('');
        }
    }, [isBatchAnalyzing, notifyListeners, showToast]);

    const startBatchIconGeneration = useCallback(async (categories: { id: string, name: string }[]) => {
        if (isBatchAnalyzing) return;
        if (categories.length === 0) return;

        setIsBatchAnalyzing(true);
        shouldStopRef.current = false;
        setBatchProgress('正在生成分类图标...');

        try {
            // 1. Call AI to get icons
            const response = await fetch('/api/ai/icon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categories: categories.map(c => c.name) })
            });

            if (!response.ok) throw new Error('AI request failed');
            const { icons } = await response.json();

            // 2. Update categories one by one to show progress
            let processedCount = 0;
            const categoryUpdates: any[] = [];

            for (let i = 0; i < categories.length; i++) {
                if (shouldStopRef.current) break;
                const cat = categories[i];
                const newIcon = icons[cat.name];

                if (newIcon) {
                    setBatchProgress(`更新图标: ${cat.name}`);
                    try {
                        await fetch(`/api/categories/${cat.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ icon: newIcon })
                        });
                        categoryUpdates.push({ id: cat.id, icon: newIcon });
                        processedCount++;
                        // Notify listeners (we need to adapt ClientWrapper to listen to 'category_update')
                        // For now, we will reuse the listener mechanism but pass a special object or use a new event
                        // But since ClientWrapper only listens for site updates, we might need a page refresh or new listener
                    } catch (e) {
                        console.error('Failed to update category icon', e);
                    }
                }
            }

            if (processedCount > 0) {
                showToast(`已更新 ${processedCount} 个分类图标`, 'success');
                // Force reload to see changes as we don't have category state sync yet
                window.location.reload();
            }

        } catch (error) {
            console.error('Icon generation error:', error);
            showToast('生成图标失败', 'error');
        } finally {
            setIsBatchAnalyzing(false);
            setBatchProgress('');
        }
    }, [isBatchAnalyzing, showToast]);

    const stopBatchAnalysis = useCallback(() => {
        shouldStopRef.current = true;
        setIsBatchAnalyzing(false);
        setBatchProgress('');
        showToast('任务已终止', 'info');
    }, [showToast]);

    return (
        <BatchAIContext.Provider value={{ isBatchAnalyzing, batchProgress, startBatchAnalysis, startBatchCategorization, startBatchIconGeneration, stopBatchAnalysis, subscribe }}>
            {children}
        </BatchAIContext.Provider>
    );
}

export function useBatchAI() {
    const context = useContext(BatchAIContext);
    if (context === undefined) {
        throw new Error('useBatchAI must be used within a BatchAIProvider');
    }
    return context;
}

