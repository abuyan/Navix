import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@nivix.site'
    const password = 'admin123'

    console.log(`Verifying login for ${email}...`)

    // Switch to 5432 if needed for this maintenance script
    // but the .env should be at 6543 or 5432 based on the last call.

    try {
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            console.error('User not found in database')
            return
        }

        console.log('User found:', {
            id: user.id,
            email: user.email,
            username: user.username,
            hasPassword: !!user.password
        })

        if (!user.password) {
            console.error('User has no password set')
            return
        }

        const match = await bcrypt.compare(password, user.password)
        if (match) {
            console.log('✅ Password verification successful!')
        } else {
            console.error('❌ Password verification failed. Hash in DB does not match "admin123"')
        }
    } catch (err) {
        console.error('Database error:', err)
    }
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
