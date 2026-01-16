import { prisma } from '@/lib/prisma';
import ClientWrapper from '@/components/ClientWrapper';
import { auth } from '@/auth';

// Use ISR (Incremental Static Regeneration) - revalidate every 3600 seconds (1 hour)
// This makes the page load instantly for visitors from cache
export const revalidate = 3600;

export default async function Home() {
  const session = await auth();

  // Decide which user's data to show
  let targetUserId: string | undefined;

  if (session?.user?.id) {
    // 1. Logged in: Show My Dashboard
    targetUserId = session.user.id;
  } else {
    // 2. Visitor: Show Admin's Public Profile (Official Template)
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    if (adminUser) {
      targetUserId = adminUser.id;
    }
  }

  // If no target user found (e.g. no admin seeded yet), return empty
  if (!targetUserId) {
    return <div>Initializing... (Please seed database)</div>;
  }

  // Fetch Panels
  // If logged in (My Dashboard), show all.
  // If visitor (Admin Template), show only public.
  const isVisitor = !session?.user;

  const allPanelsRaw = await prisma.panel.findMany({
    where: {
      userId: targetUserId,
      ...(isVisitor ? { isPublic: true } : {}) // Visitors only see public panels
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

  if (allPanels.length === 0) {
    // Edge case: Admin has no public panels or user has no panels (new user before onboarding?)
    // New user should have cloned panels. 
    // Admin should have seeded panels.
    return <div className="text-center mt-20 text-gray-500">No content available.</div>;
  }

  // Use the first panel as default
  const activePanel = allPanels[0];

  const categories = await prisma.category.findMany({
    where: {
      panelId: activePanel.id,
      userId: targetUserId
    },
    include: {
      sites: {
        orderBy: [
          { sortOrder: 'asc' }, // Maintain manual sort order
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
      panelId={activePanel.id}
      panels={allPanels}
      user={session?.user}
      readOnly={isVisitor} // Visitors are read-only
    />
  );
}
