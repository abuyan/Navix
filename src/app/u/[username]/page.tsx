import { auth } from '@/auth';
import ClientWrapper from '@/components/ClientWrapper';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

interface Props {
    params: {
        username: string;
    }
}

async function getProfileData(username: string, currentUserId?: string) {
    const user = await prisma.user.findUnique({
        where: { username },
    });

    if (!user) return null;

    const isOwner = user.id === currentUserId;

    // Fetch Panels
    const panels = await prisma.panel.findMany({
        where: {
            userId: user.id,
            ...(isOwner ? {} : { isPublic: true }) // Only public panels for visitors
        },
        orderBy: { sortOrder: 'asc' }
    });

    // If no public panels for visitor, returns empty.

    // We need to fetch categories for the FIRST panel initially default?
    // ClientWrapper usually takes `initialCategories` and `panelId`.
    // We should probably select the first panel.
    const activePanel = panels[0];

    let categories: any[] = [];

    if (activePanel) {
        categories = await prisma.category.findMany({
            where: {
                panelId: activePanel.id,
                userId: user.id
            },
            include: {
                sites: {
                    orderBy: [
                        { sortOrder: 'asc' }, // Then by manual sort
                        { visits: 'desc' },   // Sort by visits first? Logic in ClientWrapper is complex sorting.
                        // Let's just default sort by sortOrder then visits.
                    ]
                }
            },
            orderBy: { sortOrder: 'asc' }
        });
    }

    return {
        profileUser: user,
        panels,
        initialCategories: categories,
        activePanelId: activePanel?.id || '',
        isOwner
    };
}

export async function generateMetadata({ params }: Props) {
    const user = await prisma.user.findUnique({
        where: { username: params.username },
        select: { name: true }
    });

    if (!user) return { title: 'User Not Found' };
    return {
        title: `${user.name} - Nivix`,
        description: `${user.name} 的个人导航主页`
    };
}

export default async function UserProfilePage({ params }: Props) {
    const session = await auth();
    const data = await getProfileData(params.username, session?.user?.id);

    if (!data) {
        notFound();
    }

    const { panels, initialCategories, activePanelId, isOwner } = data;

    // If visitor and no panels, show empty state or "Private Profile"?
    if (!isOwner && panels.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
                <h1 className="text-2xl font-bold mb-2">私有主页</h1>
                <p>该用户的导航未公开</p>
            </div>
        );
    }

    return (
        <ClientWrapper
            initialCategories={initialCategories}
            panelId={activePanelId}
            panels={panels}
            user={session?.user} // Pass CURRENT user session
            readOnly={!isOwner}  // Read only if not owner
        />
    );
}
