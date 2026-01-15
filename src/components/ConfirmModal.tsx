import { X, AlertTriangle, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    type?: 'danger' | 'info' | 'warning';
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = '确定',
    cancelText = '取消',
    showCancel = true,
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
                        {type === 'warning' && <AlertTriangle size={18} className="text-amber-500" />}
                        {type === 'info' && <Info size={18} className="text-blue-500" />}
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

                <div className="p-6 max-h-[300px] overflow-y-auto">
                    <p className="text-sm leading-relaxed break-all" style={{ color: 'var(--color-text-secondary)' }}>
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 pt-0">
                    {showCancel && (
                        <button
                            onClick={onClose}
                            className="px-4 h-9 rounded-lg text-sm font-medium transition-all hover:bg-[var(--color-action-hover)] active:scale-95"
                            style={{
                                backgroundColor: 'var(--color-action-bg)',
                                color: 'var(--color-text-secondary)'
                            }}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`h-9 rounded-lg text-sm font-medium transition-all transform active:scale-95 ${showCancel ? 'px-6' : 'w-full px-4'}`}
                        style={{
                            backgroundColor: 'var(--color-text-primary)',
                            color: 'var(--color-bg-primary)'
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
