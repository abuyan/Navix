import { PrismaClient } from '@prisma/client';

// Singleton pattern for PrismaClient to prevent connection exhaustion
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let prismaClient: PrismaClient = globalForPrisma.prisma || new PrismaClient();

// Development hack: if the cached client is missing the new UserSetting model, force recreate it
if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma && !(globalForPrisma.prisma as any).userSetting) {
    console.warn('Stale Prisma client found (missing userSetting). Force regenerating...');
    prismaClient = new PrismaClient();
}

export const prisma = prismaClient;

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
