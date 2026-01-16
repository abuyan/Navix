import { PrismaClient } from '@prisma/client'
import { mockData } from '../src/data/mock'
import 'dotenv/config'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient() as any

async function main() {
    console.log('Start seeding...')

    // Clean up existing data in correct order
    await prisma.site.deleteMany()
    await prisma.category.deleteMany()
    await prisma.panel.deleteMany()
    await prisma.systemConfig.deleteMany()
    // Don't delete users to preserve admin account if running multiple times, 
    // or we can strictly control it. Given this is dev seed, maybe we should?
    // Let's decide to NOT delete users for now, or check existence.

    // 1. Create Default Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@nivix.com' },
        update: {},
        create: {
            name: 'Admin',
            username: 'admin',
            email: 'admin@nivix.com',
            password: hashedPassword
        }
    })
    console.log(`Admin user ready: ${adminUser.email} (ID: ${adminUser.id})`)

    // 2. Create Default Panels (Owned by Admin, Public)
    const homePanel = await prisma.panel.create({
        data: {
            name: "Home",
            icon: "Layout",
            slug: "home",
            sortOrder: 0,
            isPublic: true,
            userId: adminUser.id
        }
    })
    console.log(`Created panel: Home (${homePanel.id})`)

    const toolsPanel = await prisma.panel.create({
        data: {
            name: "常用工具",
            icon: "Wrench",
            slug: "tools",
            sortOrder: 1,
            isPublic: true,
            userId: adminUser.id
        }
    })
    console.log(`Created panel: Tools (${toolsPanel.id})`)

    const workPanel = await prisma.panel.create({
        data: {
            name: "工作",
            icon: "Briefcase",
            slug: "work",
            sortOrder: 2,
            isPublic: true,
            userId: adminUser.id
        }
    })
    console.log(`Created panel: Work (${workPanel.id})`)

    // Use Home as default for categories
    const navPanel = homePanel;

    // 3. Create Categories and Sites linked to the panel and user
    let catSortOrder = 0
    for (const category of mockData) {
        const createdCategory = await prisma.category.create({
            data: {
                name: category.name,
                panelId: navPanel.id,
                userId: adminUser.id,
                sortOrder: catSortOrder++
            }
        })
        console.log(`Created category: ${createdCategory.name}`)

        let siteSortOrder = 0
        for (const site of category.sites) {
            await prisma.site.create({
                data: {
                    title: site.title,
                    url: site.url,
                    description: site.description,
                    icon: site.icon,
                    visits: site.visits,
                    categoryId: createdCategory.id,
                    userId: adminUser.id,
                    sortOrder: siteSortOrder++
                }
            })
        }
    }

    // 4. Create Default AI Config
    await prisma.systemConfig.upsert({
        where: { key: 'AI_MODEL' },
        update: {},
        create: { key: 'AI_MODEL', value: 'glm-4-flash' }
    })
    await prisma.systemConfig.upsert({
        where: { key: 'AI_BASE_URL' },
        update: {},
        create: { key: 'AI_BASE_URL', value: 'https://open.bigmodel.cn/api/paas/v4' }
    })

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
