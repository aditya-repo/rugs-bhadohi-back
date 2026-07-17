import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { UnauthorizedError } from "../utils/errors";

/**
 * Protects storefront customer public endpoints.
 * Next.js server actions/RSC call these with header X-Customer-Sync-Secret.
 */
export function requireCustomerSyncSecret(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const expected = env.CUSTOMER_SYNC_SECRET ?? env.JWT_ACCESS_SECRET;
  const provided = req.header("x-customer-sync-secret");
  if (!provided || provided !== expected) {
    next(new UnauthorizedError("Invalid customer sync secret"));
    return;
  }
  next();
}
