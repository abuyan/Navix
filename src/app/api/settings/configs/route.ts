import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    try {
        const configs = await prisma.systemConfig.findMany();
        const configMap = configs.reduce((acc: Record<string, string>, curr: { key: string; value: string }) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        return NextResponse.json(configMap);
    } catch (error) {
        console.error('Error fetching system configs:', error);
        return NextResponse.json({ error: 'Failed to fetch configs' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { configs } = body as { configs: Record<string, string> };

        if (!configs || typeof configs !== 'object') {
            return NextResponse.json({ error: 'Invalid config data' }, { status: 400 });
        }

        // 批量更新配置
        const upserts = Object.entries(configs).map(([key, value]) =>
            prisma.systemConfig.upsert({
                where: { key },
                update: { value },
                create: { key, value }
            })
        );

        await Promise.all(upserts);

        return NextResponse.json({ message: 'Configs updated successfully' });
    } catch (error) {
        console.error('Error updating system configs:', error);
        return NextResponse.json({ error: 'Failed to update configs' }, { status: 500 });
    }
}
