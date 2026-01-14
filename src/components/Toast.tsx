'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // 3秒后自动消失
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {mounted &&
                createPortal(
                    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 pointer-events-none">
                        {toasts.map((toast) => (
                            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                        ))}
                    </div>,
                    document.body
                )}
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const icons = {
        success: <CheckCircle2 size={18} className="text-green-500" />,
        error: <AlertCircle size={18} className="text-red-500" />,
        info: <Info size={18} className="text-blue-500" />
    };

    return (
        <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300"
            style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                minWidth: '240px',
                maxWidth: '90vw'
            }}
        >
            <div className="shrink-0">{icons[toast.type]}</div>
            <p className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--color-text-primary)' }}>
                {toast.message}
            </p>
            <button
                onClick={() => onRemove(toast.id)}
                className="p-1 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors opacity-60 hover:opacity-100"
                style={{ color: 'var(--color-text-tertiary)' }}
            >
                <X size={16} />
            </button>
        </div>
    );
}
