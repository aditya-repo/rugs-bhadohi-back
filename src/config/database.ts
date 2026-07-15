import { PrismaClient } from "@prisma/client";
import { env } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function isConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return (
    code === "P1001" ||
    code === "P1017" ||
    message.includes("E57P01") ||
    message.includes("terminating connection") ||
    message.includes("Connection terminated") ||
    message.includes("Server has closed the connection")
  );
}

function createPrismaClient() {
  const base = new PrismaClient({
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        let lastError: unknown;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            return await query(args);
          } catch (error) {
            lastError = error;
            if (!isConnectionError(error) || attempt === 2) throw error;
            await base.$disconnect().catch(() => undefined);
            await base.$connect();
          }
        }
        throw lastError;
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function reconnectDatabase(): Promise<void> {
  await prisma.$disconnect().catch(() => undefined);
  await prisma.$connect();
}
