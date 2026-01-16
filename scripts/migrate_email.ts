import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const updateUser = await prisma.user.updateMany({
        where: {
            email: 'admin@navix.com'
        },
        data: {
            email: 'admin@nivix.com'
        }
    })
    console.log(`Updated ${updateUser.count} user(s).`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
