import LoginForm from '@/components/auth/LoginForm';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: '登录 - Nivix',
};

export default function LoginPage() {
    return (
        <main
            className="flex items-center justify-center min-h-screen p-4"
            style={{ backgroundColor: 'var(--color-bg-primary)' }}
        >
            <div
                className="relative w-full max-w-sm rounded-2xl shadow-2xl p-8"
                style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                }}
            >
                <div className="mb-6 text-center">
                    <h1
                        className="text-2xl font-bold mb-2"
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        Nivix 灵犀书签
                    </h1>
                    <p
                        className="text-sm"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        欢迎登录灵犀书签
                    </p>
                </div>
                <LoginForm />

                <div className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    没有账号？{' '}
                    <Link href="/register" className="hover:underline font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        立即注册
                    </Link>
                </div>
            </div>
        </main>
    );
}
