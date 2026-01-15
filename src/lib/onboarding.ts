import { prisma } from '@/lib/prisma';

/**
 * Clones the official template (Admin's public panels) for a new user.
 * This ensures new users start with a populated dashboard instead of an empty state.
 */
export async function cloneTemplateForNewUser(newUserId: string) {
    console.log(`Starting template cloning for user: ${newUserId}`);

    // 1. Find the "Template User" (Admin) - currently hardcoded or find by username 'admin'
    // We look for panels owned by admin that are public, OR just the default admin user.
    const adminUser = await prisma.user.findUnique({
        where: { username: 'admin' }, // Ensure seed creates username='admin'
        include: {
            panels: {
                where: { isPublic: true },
                include: {
                    categories: {
                        include: {
                            sites: true
                        }
                    }
                }
            }
        }
    });

    if (!adminUser || adminUser.panels.length === 0) {
        console.warn('No template data found (Admin user or panels missing). Skipping clone.');
        return;
    }

    console.log(`Found ${adminUser.panels.length} template panels to clone.`);

    // 2. Deep copy each panel
    for (const panel of adminUser.panels) {
        // Create new Panel
        const newPanel = await prisma.panel.create({
            data: {
                name: panel.name,
                icon: panel.icon,
                sortOrder: panel.sortOrder,
                slug: `${panel.slug}-${newUserId.slice(-4)}`, // Ensure unique slug if needed, or just let them have same slug if scoped by user? 
                // Wait, slug is unique globally in schema? 
                // schema: slug String? @unique. Yes globally unique.
                // So we must append random chars or username.
                userId: newUserId,
                isPublic: false // Personal copies are private by default
            }
        });

        // Clone Categories
        for (const category of panel.categories) {
            const newCategory = await prisma.category.create({
                data: {
                    name: category.name,
                    icon: category.icon,
                    sortOrder: category.sortOrder,
                    panelId: newPanel.id,
                    userId: newUserId
                }
            });

            // Clone Sites
            // SQLite does not support createMany, so we use Promise.all
            if (category.sites.length > 0) {
                await Promise.all(
                    category.sites.map(site =>
                        prisma.site.create({
                            data: {
                                title: site.title,
                                url: site.url,
                                description: site.description,
                                icon: site.icon,
                                sortOrder: site.sortOrder,
                                isPinned: site.isPinned,
                                tags: site.tags,
                                aiAnalyzed: site.aiAnalyzed,
                                categoryId: newCategory.id,
                                userId: newUserId
                            }
                        })
                    )
                );
            }
        }
    }

    console.log(`Template cloning completed for user: ${newUserId}`);
}
