import { X, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = '确定',
    cancelText = '取消',
    type = 'danger'
}: ConfirmModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            // 键盘 ESC 关闭
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleKeyDown);

            // 锁定背景滚动
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';

            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
            };
        }
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}
        >
            <div
                className="w-full max-w-sm rounded-2xl shadow-2xl animate-in zoom-in duration-200"
                style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-2">
                        {type === 'danger' && <AlertTriangle size={18} className="text-red-500" />}
                        <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                    >
                        <X size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 pt-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-[var(--color-bg-tertiary)]"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-semibold transition-all transform active:scale-95"
                        style={{
                            backgroundColor: type === 'danger' ? '#ef4444' : 'var(--color-accent)',
                            color: 'white',
                            boxShadow: type === 'danger' ? '0 4px 12px rgba(239, 68, 68, 0.2)' : 'none'
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default ConfirmModal;
