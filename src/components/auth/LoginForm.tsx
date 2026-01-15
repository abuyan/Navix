'use client';

import { useActionState } from 'react';
import { authenticate } from '@/lib/actions';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function LoginForm() {
    const [errorMessage, formAction, isPending] = useActionState(
        authenticate,
        undefined,
    );

    return (
        <form action={formAction} className="flex flex-col gap-4">
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
