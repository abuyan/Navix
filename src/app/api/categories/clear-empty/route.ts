
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { panelId } = await req.json();

        if (!panelId) {
            return NextResponse.json({ error: 'Missing panelId' }, { status: 400 });
        }

        // Delete categories that belong to the panel and have no sites
        const result = await prisma.category.deleteMany({
            where: {
                panelId: panelId,
                sites: {
                    none: {}
                }
            }
        });

        return NextResponse.json({
            success: true,
            count: result.count
        });

    } catch (error) {
        console.error('Failed to clear empty categories:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
