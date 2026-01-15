import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
    try {
        const session = await auth();

        let configMap: Record<string, string> = {};

        // 1. Fetch Global System Config (as base/fallback)
        const systemConfigs = await prisma.systemConfig.findMany();
        systemConfigs.forEach(c => {
            configMap[c.key] = c.value;
        });

        // 2. If logged in, overlay with User-Specific Settings
        if (session?.user?.id) {
            const userSettings = await prisma.userSetting.findMany({
                where: { userId: session.user.id }
            });
            userSettings.forEach(s => {
                configMap[s.key] = s.value;
            });
        }

        return NextResponse.json(configMap);
    } catch (error) {
        console.error('Error fetching configs:', error);
        return NextResponse.json({ error: 'Failed to fetch configs' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        const body = await request.json();
        const { configs } = body as { configs: Record<string, string> };

        if (!configs || typeof configs !== 'object') {
            return NextResponse.json({ error: 'Invalid config data' }, { status: 400 });
        }

        const keys = Object.entries(configs);

        if (userId) {
            // Save to UserSetting for authenticated users
            const upserts = keys.map(([key, value]) =>
                prisma.userSetting.upsert({
                    where: { userId_key: { userId, key } },
                    update: { value },
                    create: { userId, key, value }
                })
            );
            await Promise.all(upserts);
        } else {
            // Fallback for system-wide settings (only if no user, usually admin stuff)
            const upserts = keys.map(([key, value]) =>
                prisma.systemConfig.upsert({
                    where: { key },
                    update: { value },
                    create: { key, value }
                })
            );
            await Promise.all(upserts);
        }

        return NextResponse.json({ message: 'Configs updated successfully' });
    } catch (error) {
        console.error('Error updating configs:', error);
        return NextResponse.json({ error: 'Failed to update configs' }, { status: 500 });
    }
}
