'use client';

import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface UpdatePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UpdatePasswordModal({ isOpen, onClose }: UpdatePasswordModalProps) {
    const { showToast } = useToast();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    if (!isOpen) return null;

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) return;

        setIsChangingPassword(true);
        try {
            const res = await fetch('/api/user/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (res.ok) {
                showToast('密码修改成功', 'success');
                setCurrentPassword('');
                setNewPassword('');
                onClose();
            } else {
                const data = await res.json();
                showToast(data.error || '修改失败', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('修改失败', 'error');
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
                    <h3 className="font-bold text-lg">修改密码</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        为了保障您的账户安全，修改密码前需要验证当前密码。
                    </p>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>当前密码</label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="请输入当前密码"
                                className="w-full pl-4 pr-10 h-10 rounded-lg border outline-none text-sm bg-[var(--color-bg-primary)] border-[var(--color-border)] focus:border-[var(--color-primary)] text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-2.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                            >
                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>新密码</label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="请输入新密码 (至少 6 位)"
                                className="w-full pl-4 pr-10 h-10 rounded-lg border outline-none text-sm bg-[var(--color-bg-primary)] border-[var(--color-border)] focus:border-[var(--color-primary)] text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-2.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                            >
                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-tertiary)] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm font-medium hover:bg-[var(--color-bg-primary)] transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleChangePassword}
                        disabled={isChangingPassword || !currentPassword || !newPassword}
                        className="px-4 py-2 rounded-lg bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        {isChangingPassword ? '修改中...' : '确认修改'}
                    </button>
                </div>
            </div>
        </div>
    );
}
