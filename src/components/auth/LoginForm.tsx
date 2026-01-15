'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function LoginForm() {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);
        setErrorMessage(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false, // 不自动重定向，手动处理
            });

            if (result?.error) {
                setErrorMessage('邮箱或密码错误');
                setIsPending(false);
            } else {
                // 登录成功，硬刷新跳转到首页（确保服务端重新渲染）
                window.location.href = '/';
            }
        } catch (error) {
            setErrorMessage('登录失败，请重试');
            setIsPending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
                <label
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text-secondary)' }}
                    htmlFor="email"
                >
                    邮箱
                </label>
                <input
                    className="w-full px-4 h-9 rounded-lg border outline-none text-sm transition-colors focus:border-[var(--color-text-primary)]"
                    style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                    }}
                    id="email"
                    type="email"
                    name="email"
                    placeholder="admin@navix.com"
                    defaultValue="admin@navix.com"
                    required
                />
            </div>
            <div className="space-y-2">
                <label
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text-secondary)' }}
                    htmlFor="password"
                >
                    密码
                </label>
                <input
                    className="w-full px-4 h-9 rounded-lg border outline-none text-sm transition-colors focus:border-[var(--color-text-primary)]"
                    style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                    }}
                    id="password"
                    type="password"
                    name="password"
                    defaultValue="admin123"
                    required
                    minLength={6}
                />
            </div>

            {errorMessage && (
                <div
                    className="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                >
                    <AlertTriangle className="h-4 w-4" />
                    <p>{errorMessage}</p>
                </div>
            )}

            <button
                type="submit"
                className="w-full h-9 mt-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                    backgroundColor: 'var(--color-text-primary)',
                    color: 'var(--color-bg-primary)'
                }}
                aria-disabled={isPending}
                disabled={isPending}
            >
                {isPending && <Loader2 className="animate-spin h-4 w-4" />}
                登录
            </button>
        </form>
    );
}
