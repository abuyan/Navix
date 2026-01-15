import LoginForm from '@/components/auth/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '登录 - Navix',
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
                        Navix
                    </h1>
                    <p
                        className="text-sm"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        请登录以管理导航内容
                    </p>
                </div>
                <LoginForm />
            </div>
        </main>
    );
}
