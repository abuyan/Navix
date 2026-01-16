import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

// Get User's Panels
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const panelsRaw = await prisma.panel.findMany({
            where: { userId: session.user.id },
            include: {
                categories: {
                    include: {
                        _count: {
                            select: { sites: true }
                        }
                    }
                }
            },
            orderBy: { sortOrder: 'asc' },
        });

        const panels = panelsRaw.map(panel => ({
            ...panel,
            siteCount: panel.categories.reduce((acc, cat) => acc + cat._count.sites, 0)
        }));

        return NextResponse.json(panels);
    } catch (error) {
        console.error('Error fetching panels:', error);
        return NextResponse.json(
            { error: 'Failed to fetch panels' },
            { status: 500 }
        );
    }
}

// Create New Panel
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, icon, slug, isPublic } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Panel name is required' },
                { status: 400 }
            );
        }

        // Get sort order scoped to user
        const maxPanel = await prisma.panel.findFirst({
            where: { userId: session.user.id },
            orderBy: { sortOrder: 'desc' }
        });
        const newSortOrder = (maxPanel?.sortOrder ?? 0) + 1;

        const panel = await prisma.panel.create({
            data: {
                name,
                icon: icon || null,
                slug: slug || null,
                sortOrder: newSortOrder,
                userId: session.user.id,
                isPublic: isPublic ?? false // Use provided value or default to private
            }
        });

        return NextResponse.json(panel);
    } catch (error: any) {
        console.error('Error creating panel:', error);

        // Handle Unique Constraint Violation (Slug)
        if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
            return NextResponse.json(
                { error: '该路径标识 (Slug) 已被占用，请更换' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create panel' },
            { status: 500 }
        );
    }
}
