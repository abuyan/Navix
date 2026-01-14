import { prisma } from '@/lib/prisma';
import ClientWrapper from '@/components/ClientWrapper';

// Use ISR (Incremental Static Regeneration) - revalidate every 60 seconds
// This caches the page but still shows updated data within 60s
export const revalidate = 60;

export default async function Home() {
  const panel = await prisma.panel.findFirst({
    where: { slug: 'nav' },
  });

  if (!panel) return <div>Panel not found</div>;

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
