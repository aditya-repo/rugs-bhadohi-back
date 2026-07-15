import { AuthenticatedRequest } from "../types/express";

declare global {
  namespace Express {
    interface Request {
      admin?: AuthenticatedRequest["admin"];
    }
  }
}

export {};
