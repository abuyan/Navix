import { prisma } from '@/lib/prisma';
import ClientWrapper from '@/components/ClientWrapper';

// Use ISR (Incremental Static Regeneration) - revalidate every 60 seconds
// This caches the page but still shows updated data within 60s
export const revalidate = 60;

export default async function Home() {
  const categories = await prisma.category.findMany({
    include: {
      sites: {
        orderBy: {
          visits: 'desc'
        }
      }
    }
  });

  return <ClientWrapper categories={categories} />;
}
