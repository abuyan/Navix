import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const email = args[1];
    const password = args[2];

    if (!command || !email) {
        console.log('Usage:');
        console.log('  Create/Update User: npx tsx scripts/manage-user.ts set <email> <password>');
        console.log('  Delete User:        npx tsx scripts/manage-user.ts delete <email>');
        console.log('  List Users:         npx tsx scripts/manage-user.ts list');
        return;
    }

    try {
        if (command === 'list') {
            const users = await prisma.user.findMany();
            console.log('Current Users:');
            users.forEach(u => console.log(`- ${u.name || 'No Name'} (${u.email})`));
            return;
        }

        if (command === 'delete') {
            await prisma.user.delete({ where: { email } });
            console.log(`✅ User ${email} deleted.`);
            return;
        }

        if (command === 'set') {
            if (!password) {
                console.error('❌ Password is required for set command.');
                return;
            }
            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await prisma.user.upsert({
                where: { email },
                update: { password: hashedPassword },
                create: {
                    email,
                    password: hashedPassword,
                    name: email.split('@')[0], // Default name from email
                },
            });
            console.log(`✅ User ${user.email} created/updated successfully.`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
