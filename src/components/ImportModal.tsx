'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';

type ImportStats = {
    newCategories: number;
    importedSites: number;
    skippedSites: number;
    totalParsed: number;
};

type ImportState = 'idle' | 'selected' | 'uploading' | 'success' | 'error';

export default function ImportModal({
    isOpen,
    onClose,
    onSuccess
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}) {
    const [state, setState] = useState<ImportState>('idle');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [message, setMessage] = useState<string | null>(null);


    const [stats, setStats] = useState<ImportStats | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const resetState = useCallback(() => {
        setState('idle');
        setSelectedFile(null);
        setMessage('');
        setStats(null);
        setIsDragOver(false);
    }, []);

    const handleClose = useCallback(() => {
        resetState();
        onClose();
    }, [resetState, onClose]);

    // 键盘 ESC 关闭 & 锁定背景滚动
    useEffect(() => {
        if (isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') handleClose();
            };
            window.addEventListener('keydown', handleKeyDown);

            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';

            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
            };
        }
    }, [isOpen, handleClose]);

    const handleFileSelect = useCallback((file: File) => {
        if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
            setState('error');
            setMessage('请选择 .html 或 .htm 格式的书签文件');
            return;
        }
        setSelectedFile(file);
        setState('selected');
        setMessage('');
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleImport = async () => {
        if (!selectedFile) return;

        setState('uploading');
        setMessage('正在导入书签...');

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch('/api/import', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '导入失败');
            }

            setState('success');
            setMessage(data.message);
            setStats(data.stats);

            // 刷新页面以显示新数据
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            }
        } catch (error) {
            setState('error');
            setMessage(error instanceof Error ? error.message : '导入失败，请重试');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />

            {/* Modal */}
            <div
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-2xl p-6"
                style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-xl)'
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2
                        className="text-lg font-bold"
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        导入书签
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-1 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)]"
                        style={{ color: 'var(--color-text-tertiary)' }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                {state === 'idle' || state === 'selected' || state === 'error' ? (
                    <>
                        {/* Drop Zone */}
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragOver ? 'scale-[1.02]' : ''
                                }`}
                            style={{
                                borderColor: isDragOver ? 'var(--color-accent)' : 'var(--color-border)',
                                backgroundColor: isDragOver ? 'var(--color-accent-soft)' : 'var(--color-bg-tertiary)'
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".html,.htm"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileSelect(file);
                                }}
                            />

                            {selectedFile ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: 'var(--color-accent-soft)' }}
                                    >
                                        <FileText className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
                                    </div>
                                    <div>
                                        <p
                                            className="font-medium"
                                            style={{ color: 'var(--color-text-primary)' }}
                                        >
                                            {selectedFile.name}
                                        </p>
                                        <p
                                            className="text-sm mt-1"
                                            style={{ color: 'var(--color-text-tertiary)' }}
                                        >
                                            {(selectedFile.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <Upload className="w-10 h-10" style={{ color: 'var(--color-text-tertiary)' }} />
                                    <div>
                                        <p
                                            className="font-medium"
                                            style={{ color: 'var(--color-text-primary)' }}
                                        >
                                            拖拽书签文件到此处
                                        </p>
                                        <p
                                            className="text-sm mt-1"
                                            style={{ color: 'var(--color-text-tertiary)' }}
                                        >
                                            或点击选择文件（.html）
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {state === 'error' && message && (
                            <div
                                className="mt-4 flex items-center gap-2 p-3 rounded-lg"
                                style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444'
                                }}
                            >
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">{message}</span>
                            </div>
                        )}

                        {/* Help Text */}
                        <p
                            className="mt-4 text-xs"
                            style={{ color: 'var(--color-text-tertiary)' }}
                        >
                            支持 Chrome、Edge、Firefox、Safari 等浏览器导出的书签文件
                        </p>

                        {/* Action Buttons */}
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleClose}
                                className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors"
                                style={{
                                    backgroundColor: 'var(--color-bg-tertiary)',
                                    color: 'var(--color-text-secondary)'
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!selectedFile}
                                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: selectedFile
                                        ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                        : 'var(--color-bg-tertiary)',
                                    color: selectedFile ? 'white' : 'var(--color-text-tertiary)'
                                }}
                            >
                                开始导入
                            </button>
                        </div>
                    </>
                ) : state === 'uploading' ? (
                    <div className="py-8 flex flex-col items-center gap-4">
                        <Loader2
                            className="w-12 h-12 animate-spin"
                            style={{ color: 'var(--color-accent)' }}
                        />
                        <p
                            className="font-medium"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            {message}
                        </p>
                    </div>
                ) : state === 'success' ? (
                    <div className="py-8 flex flex-col items-center gap-4">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                        >
                            <Check className="w-8 h-8" style={{ color: '#22c55e' }} />
                        </div>
                        <div className="text-center">
                            <p
                                className="font-medium"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                导入成功！
                            </p>
                            {stats && (
                                <p
                                    className="text-sm mt-2"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                >
                                    新增 {stats.newCategories} 个分类，{stats.importedSites} 个书签
                                    {stats.skippedSites > 0 && `（跳过 ${stats.skippedSites} 个重复）`}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-6 py-2.5 rounded-lg font-medium text-white"
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                            }}
                        >
                            刷新页面
                        </button>
                    </div>
                ) : null}
            </div>
        </>
    );
}
