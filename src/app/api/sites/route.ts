import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, url, description, icon, categoryId, sortOrder, isPinned } = body;

        if (!title || !url || !categoryId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const site = await prisma.site.create({
            data: {
                title,
                url,
                description,
                icon,
                categoryId,
                sortOrder: sortOrder || 0,
                isPinned: isPinned || false,
            },
        });

        return NextResponse.json(site, { status: 201 });
    } catch (error) {
        console.error('Failed to create site:', error);
        return NextResponse.json(
            { error: 'Failed to create site' },
            { status: 500 }
        );
    }
}
