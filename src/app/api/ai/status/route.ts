import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ configured: false });
        }

        // 使用 as any 绕过可能存在的类型定义同步延迟
        const config = await (prisma as any).userSetting.findUnique({
            where: {
                userId_key: {
                    userId: session.user.id,
                    key: 'AI_API_KEY'
                }
            }
        });

        // Check if key exists and is not empty
        const configured = !!(config?.value && config.value.trim().length > 0);

        return NextResponse.json({ configured });
    } catch (error) {
        console.error('Error checking AI status:', error);
        return NextResponse.json({ configured: false });
    }
}
