import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@nivix.site'
    const newPassword = 'admin123' // You can change this if needed
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    console.log(`Updating administrator (username: admin) to ${email}...`)

    const user = await prisma.user.update({
        where: { username: 'admin' },
        data: {
            email: email,
            password: hashedPassword,
        }
    })

    console.log(`Password reset successful for user: ${user.email}`)
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
