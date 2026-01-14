import { prisma } from '@/lib/prisma';
import ClientWrapper from '@/components/ClientWrapper';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export default async function PanelPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

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

    // 获取所有 panels 用于导航
    const allPanels = await prisma.panel.findMany({
        orderBy: { sortOrder: 'asc' }
    });

    const categories = await prisma.category.findMany({
        where: { panelId: panel.id },
        include: {
            sites: {
                orderBy: [
                    { visits: 'desc' }
                ]
            }
        },
        orderBy: {
            sortOrder: 'asc'
        }
    });

    return <ClientWrapper initialCategories={categories} panelId={panel.id} panels={allPanels} />;
}
