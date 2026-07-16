import { createApp } from "./app";
import { allowedFrontendOrigins, env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./config/database";

const app = createApp();

async function start(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("Database connected");

    app.listen(env.PORT, env.HOST, () => {
      logger.info(`Server running on http://${env.HOST}:${env.PORT}`);
      logger.info(`Swagger docs: http://${env.HOST}:${env.PORT}/api/docs`);
      logger.info(`CORS allowlist: ${allowedFrontendOrigins.join(", ")}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down");
  await prisma.$disconnect();
  process.exit(0);
});

start();
