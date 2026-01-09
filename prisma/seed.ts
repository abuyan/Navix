import { PrismaClient } from '@prisma/client'
import { mockData } from '../src/data/mock'
import 'dotenv/config'

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
})

async function main() {
    console.log('Start seeding...')

    // Clean up existing data
    await prisma.site.deleteMany()
    await prisma.category.deleteMany()

    for (const category of mockData) {
        const createdCategory = await prisma.category.create({
            data: {
                name: category.name, // We use the name from mock data
                // We'll let ID and sortOrder be default for now, or we could map them
            }
        })
        console.log(`Created category with id: ${createdCategory.id}`)

        for (const site of category.sites) {
            const createdSite = await prisma.site.create({
                data: {
                    title: site.title,
                    url: site.url,
                    description: site.description,
                    icon: site.icon,
                    visits: site.visits,
                    categoryId: createdCategory.id
                }
            })
            console.log(`Created site with id: ${createdSite.id}`)
        }
    }
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
