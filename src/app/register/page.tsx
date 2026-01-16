import RegisterForm from '@/components/auth/RegisterForm';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: '注册 - Nivix',
};

export default function RegisterPage() {
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
                        加入 Nivix 灵犀导航
                    </h1>
                    <p
                        className="text-sm"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        一款 AI 驱动的智能书签，懂收藏，更懂整理。
                    </p>
                </div>
                <RegisterForm />

                <div className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    已有账号？{' '}
                    <Link href="/login" className="hover:underline font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        立即登录
                    </Link>
                </div>
            </div>
        </main>
    );
}
