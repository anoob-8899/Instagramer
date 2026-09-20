import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Singleton for Instagramer
 * 
 * CON 01 NOTICE:
 * This client singleton is defined for local application architecture.
 * No database connection is established or queried in CON 01.
 * Real connection binding will occur in CON 02.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
