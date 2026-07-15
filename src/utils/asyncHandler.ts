import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { AppError } from "./errors";
import { sendError } from "./response";
import { logger } from "../config/logger";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, err.code, err.details);
  }

  if (err instanceof ZodError) {
    return sendError(res, 400, "Validation failed", "VALIDATION_ERROR", err.flatten());
  }

  if (err instanceof TokenExpiredError) {
    return sendError(res, 401, "Token expired", "TOKEN_EXPIRED");
  }

  if (err instanceof JsonWebTokenError) {
    return sendError(res, 401, "Invalid token", "INVALID_TOKEN");
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[])?.join(", ") ?? "field";
      return sendError(res, 409, `Duplicate value for ${target}`, "DUPLICATE_ENTRY");
    }
    if (err.code === "P2025") {
      return sendError(res, 404, "Resource not found", "NOT_FOUND");
    }
  }

  logger.error("Unhandled error:", err);
  return sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
}

export function notFoundHandler(_req: Request, res: Response): Response {
  return sendError(res, 404, "Route not found", "ROUTE_NOT_FOUND");
}

export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: T, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
