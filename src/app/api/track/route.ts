import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Update visit count
        const updatedSite = await prisma.site.update({
            where: { id },
            data: {
                visits: {
                    increment: 1
                }
            }
        });

        return NextResponse.json({ success: true, visits: updatedSite.visits });
    } catch (error) {
        console.error('Error tracking visit:', error);
        return NextResponse.json({ error: 'Failed to track visit' }, { status: 500 });
    }
}
