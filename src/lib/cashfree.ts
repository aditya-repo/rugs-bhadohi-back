import { Cashfree, CFEnvironment } from "cashfree-pg";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

let client: Cashfree | null = null;

export function isCashfreeConfigured(): boolean {
  return Boolean(env.CASHFREE_APP_ID?.trim() && env.CASHFREE_SECRET_KEY?.trim());
}

export function getCashfreeEnv(): "sandbox" | "production" {
  return env.CASHFREE_ENV;
}

export function getCashfreeClient(): Cashfree {
  if (!isCashfreeConfigured()) {
    throw new AppError(
      503,
      "Cashfree is not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.",
      "CASHFREE_NOT_CONFIGURED",
    );
  }

  if (!client) {
    const environment =
      env.CASHFREE_ENV === "production"
        ? CFEnvironment.PRODUCTION
        : CFEnvironment.SANDBOX;
    client = new Cashfree(
      environment,
      env.CASHFREE_APP_ID!,
      env.CASHFREE_SECRET_KEY!,
    );
    client.XApiVersion = env.CASHFREE_API_VERSION;
  }

  return client;
}

/** Digits-only phone suitable for Cashfree (prefer 10-digit Indian mobile). */
export function normalizeCashfreePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}
