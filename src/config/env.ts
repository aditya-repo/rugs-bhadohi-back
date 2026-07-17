import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("1h"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
  MAX_FILE_SIZE: z.coerce.number().default(10485760),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default("rug-casa"),
  APP_URL: z.string().url(),
  /**
   * Comma-separated storefront origins allowed by CORS.
   * Example: https://www.rugsbhadohi.com,https://rugsbhadohi.com,http://localhost:3000
   * The first entry is used for email / password-reset links.
   */
  FRONTEND_URL: z.string().min(1),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_NAME: z.string().default("Admin"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  /** Shared secret for storefront customer sync/profile (Next.js server → API). */
  CUSTOMER_SYNC_SECRET: z.string().min(16).optional(),
});
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";

/** Always-allowed production storefront origins (even if FRONTEND_URL is misconfigured). */
const BUILTIN_FRONTEND_ORIGINS = [
  "https://www.rugsbhadohi.com",
  "https://rugsbhadohi.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, "");
}

/** Parsed CORS allowlist: FRONTEND_URL entries + built-in production/local origins. */
export const allowedFrontendOrigins = [
  ...new Set([
    ...env.FRONTEND_URL.split(",").map(normalizeOrigin).filter(Boolean),
    ...BUILTIN_FRONTEND_ORIGINS,
  ]),
];

/** Primary frontend base URL (first FRONTEND_URL entry) for links in emails. */
export const primaryFrontendUrl =
  normalizeOrigin(env.FRONTEND_URL.split(",")[0] ?? "") || BUILTIN_FRONTEND_ORIGINS[0];
