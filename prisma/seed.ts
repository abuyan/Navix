import { PrismaClient } from '@prisma/client'
import { mockData } from '../src/data/mock'
import 'dotenv/config'

const prisma = new PrismaClient() as any

async function main() {
    console.log('Start seeding...')

    // Clean up existing data in correct order
    await prisma.site.deleteMany()
    await prisma.category.deleteMany()
    await prisma.panel.deleteMany()
    await prisma.systemConfig.deleteMany()

    // 1. Create Default Panel
    const navPanel = await prisma.panel.create({
        data: {
            name: "Home",
            icon: "Layout",
            slug: "home",
            sortOrder: 0
        }
    })
    console.log(`Created panel with id: ${navPanel.id}`)

    // 2. Create Categories and Sites linked to the panel
    let catSortOrder = 0
    for (const category of mockData) {
        const createdCategory = await prisma.category.create({
            data: {
                name: category.name,
                panelId: navPanel.id,
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
                    sortOrder: siteSortOrder++
                }
            })
        }
    }

    // 3. Create Default AI Config (Optional but helpful)
    await prisma.systemConfig.create({
        data: { key: 'AI_MODEL', value: 'glm-4-flash' }
    })
    await prisma.systemConfig.create({
        data: { key: 'AI_BASE_URL', value: 'https://open.bigmodel.cn/api/paas/v4' }
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
