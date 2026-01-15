'use client';

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Site } from '@prisma/client';

interface BatchAIContextType {
    isBatchAnalyzing: boolean;
    batchProgress: string;
    startBatchAnalysis: (sites: Site[]) => Promise<void>;
    subscribe: (callback: (updatedSite: any) => void) => () => void;
}

const BatchAIContext = createContext<BatchAIContextType | undefined>(undefined);

export function BatchAIProvider({ children }: { children: React.ReactNode }) {
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
            setBatchProgress('没有需要整理的站点');
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
                setBatchProgress(`${i + 1}/${pendingSites.length}`);

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

                    if (!extractRes.ok) throw new Error('Extract failed');
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
                } catch (err) {
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

    return (
        <BatchAIContext.Provider value={{ isBatchAnalyzing, batchProgress, startBatchAnalysis, subscribe }}>
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
