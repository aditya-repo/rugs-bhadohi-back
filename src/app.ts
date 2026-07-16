import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { allowedFrontendOrigins } from "./config/env";
import { logger } from "./config/logger";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./utils/asyncHandler";
import { swaggerSpec } from "./config/swagger";

export function createApp(): express.Application {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin(origin, callback) {
        // Non-browser clients (curl, server-to-server) send no Origin header.
        if (!origin) {
          callback(null, true);
          return;
        }
        if (allowedFrontendOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS blocked origin: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  app.use(
    morgan("combined", {
      stream: { write: (message: string) => logger.info(message.trim()) },
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: "list",
        filter: true,
        tryItOutEnabled: true,
      },
      customSiteTitle: "Rug Casa Admin API",
    }),
  );
  app.get("/api/docs.json", (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use("/api/v1", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
