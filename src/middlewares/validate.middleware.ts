import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { ValidationError } from "../utils/errors";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError("Invalid request body", result.error.flatten());
    }
    // Express 5: req.body is mutable — replace contents in place
    if (req.body && typeof req.body === "object") {
      for (const key of Object.keys(req.body as object)) {
        delete (req.body as Record<string, unknown>)[key];
      }
      Object.assign(req.body, result.data);
    } else {
      (req as Request & { body: T }).body = result.data;
    }
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      throw new ValidationError("Invalid query parameters", result.error.flatten());
    }
    // Express 5: req.query is read-only — validate only, do not reassign
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      throw new ValidationError("Invalid route parameters", result.error.flatten());
    }
    // Express 5: req.params is read-only — validate only, do not reassign
    next();
  };
}
