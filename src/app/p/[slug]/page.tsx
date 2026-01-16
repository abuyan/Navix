import { prisma } from '@/lib/prisma';
import ClientWrapper from '@/components/ClientWrapper';
import { notFound } from 'next/navigation';
import { auth, signOut } from '@/auth';

export const revalidate = 60;

export default async function PanelPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const session = await auth();

    // Verify Session Integrity (Handle stale session after DB reset)
    if (session?.user?.id) {
        const userExists = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!userExists) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                    <h1 className="text-xl font-bold">会话已失效 (Session Expired)</h1>
                    <p className="text-gray-500">检测到数据库已重置，请重新登录以同步数据。</p>
                    <form action={async () => {
                        'use server';
                        await signOut({ redirectTo: '/login' });
                    }}>
                        <button className="px-4 py-2 bg-black text-white rounded-lg hover:opacity-80 transition-opacity">
                            重新登录 (Re-Login)
                        </button>
                    </form>
                </div>
            );
        }
    }

    const panel = await prisma.panel.findFirst({
        where: {
            OR: [
                { slug: slug },
                { id: slug }
            ]
        },
    });

    if (!panel) {
        notFound();
    }

    // Check permissions
    const isOwner = session?.user?.id === panel.userId;
    if (!panel.isPublic && !isOwner) {
        notFound();
    }

    const isVisitor = !session?.user;
    // Determine target user for the navigation context
    // If viewing a public panel of another user, we might want to show THAT user's other public panels in navigation?
    // Or just show the current user's panels if logged in?
    // "Official Template" logic suggests if visitor, show Admin's panels.
    // If logged in but viewing public panel, maybe show My Dashboard in nav?
    // This is a UI decision.
    // For now, let's keep consistency with `page.tsx`:
    // - If visitor: Show owner's panels (read-only).
    // - If logged in: Show owner's panels? Or My panels?
    // - If I am viewing a shared tool page, I probably want to see *that* context.

    // Let's stick to "Context of the Panel Owner".
    const targetUserId = panel.userId;

    // Fetch panels for the top navigation (Siblings of the current panel)
    const allPanelsRaw = await prisma.panel.findMany({
        where: {
            userId: targetUserId,
            ...((!isOwner) ? { isPublic: true } : {})
        },
        include: {
            categories: {
                include: {
                    _count: {
                        select: { sites: true }
                    }
                }
            }
        },
        orderBy: { sortOrder: 'asc' }
    });

    const allPanels = allPanelsRaw.map(panel => ({
        ...panel,
        siteCount: panel.categories.reduce((acc, cat) => acc + cat._count.sites, 0)
    }));

    const categories = await prisma.category.findMany({
        where: {
            panelId: panel.id,
            userId: targetUserId // Ensure category belongs to same user (redundant but safe)
        },
        include: {
            sites: {
                orderBy: [
                    { sortOrder: 'asc' },
                    { visits: 'desc' }
                ]
            }
        },
        orderBy: {
            sortOrder: 'asc'
        }
    });

    return (
        <ClientWrapper
            initialCategories={categories}
            panelId={panel.id}
            panels={allPanels}
            user={session?.user}
            readOnly={!isOwner}
        />
    );
}
