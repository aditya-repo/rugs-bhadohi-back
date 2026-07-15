import { UnauthorizedError } from "../utils/errors";
import { verifyAccessToken } from "../config/jwt";
import { extractBearerToken } from "../utils/token";
import { AuthenticatedRequest } from "../types/express";
import { NextFunction, Response } from "express";

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    throw new UnauthorizedError("Access token required");
  }

  try {
    const payload = verifyAccessToken(token);
    req.admin = {
      id: payload.sub,
      email: payload.email,
      name: "",
    };
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}
