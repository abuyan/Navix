'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, CheckCircle2, X } from 'lucide-react';
import { useBatchAI } from '@/contexts/BatchAIContext';

export default function AITaskIndicator() {
    const { isBatchAnalyzing, batchProgress, stopBatchAnalysis } = useBatchAI();
    const [isVisible, setIsVisible] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        if (isBatchAnalyzing) {
            setIsVisible(true);
            setIsFinished(false);
        } else if (batchProgress === '无需整理') {
            setIsVisible(true);
            setIsFinished(false);
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 3000);
            return () => clearTimeout(timer);
        } else if (isVisible && !isBatchAnalyzing) {
            // Processing finished
            setIsFinished(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setIsFinished(false);
            }, 3000); // Show "Finished" for 3 seconds
            return () => clearTimeout(timer);
        }
    }, [isBatchAnalyzing, isVisible, batchProgress]);

    if (!isVisible) return null;

    return (
        <div
            className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-4 duration-300"
        >
            <div
                className={`relative overflow-hidden p-[1.5px] rounded-xl shadow-2xl transition-all ${!isFinished ? 'btn-ai-active scale-100' : 'scale-95 opacity-90'}`}
                style={{
                    backgroundColor: 'var(--color-border)',
                }}
            >
                <div
                    className="flex items-center gap-3 px-4 py-3 rounded-[11px] relative z-10 min-w-[180px]"
                    style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                    }}
                >
                    <div className="flex-shrink-0">
                        {isFinished ? (
                            <CheckCircle2 size={20} className="text-green-500 animate-in zoom-in duration-300" />
                        ) : isBatchAnalyzing ? (
                            <div className="relative flex items-center justify-center w-[20px] h-[20px]">
                                <Loader2 size={18} className="animate-spin text-[var(--color-accent)]" />
                            </div>
                        ) : (
                            <Sparkles size={18} className="text-[var(--color-accent)]" />
                        )}
                    </div>

                    <div className="flex flex-col flex-1 mr-2">
                        <span
                            className="text-xs font-semibold uppercase tracking-wider opacity-60"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            AI 智能整理
                        </span>
                        <div className="flex items-center gap-2">
                            <span
                                className="text-sm font-medium"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                {isFinished ? '整理已完成' : (batchProgress || '准备中...')}
                            </span>
                        </div>
                    </div>

                    {/* Close/Stop Button */}
                    {!isFinished && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                stopBatchAnalysis();
                            }}
                            className="p-1 rounded-full hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                            title="停止任务"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
