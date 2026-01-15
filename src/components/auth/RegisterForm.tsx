'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function RegisterForm() {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsPending(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || '注册失败');
            }

            // Redirect to login page on success
            router.push('/login?registered=true');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsPending(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }} htmlFor="username">
                    用户名
                </label>
                <input
                    className="w-full px-4 h-9 rounded-lg border outline-none text-sm transition-colors focus:border-[var(--color-text-primary)]"
                    style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                    }}
                    id="username"
                    name="username"
                    type="text"
                    required
                    minLength={3}
                    placeholder="例如: abu"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }} htmlFor="email">
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
                    name="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }} htmlFor="password">
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
                    name="password"
                    type="password"
                    required
                    minLength={6}
                />
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <p>{error}</p>
                </div>
            )}

            <button
                className="w-full h-9 mt-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                    backgroundColor: 'var(--color-text-primary)',
                    color: 'var(--color-bg-primary)'
                }}
                disabled={isPending}
            >
                {isPending && <Loader2 className="animate-spin h-4 w-4" />}
                注册新账号
            </button>
        </form>
    );
}
