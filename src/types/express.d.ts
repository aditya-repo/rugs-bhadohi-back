import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    email: string;
    name: string;
  };
  /** Raw JSON body string (for webhook signature verification). */
  rawBody?: string;
}

declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
    }
  }
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export type UploadFolder = "products" | "categories" | "banners" | "collections" | "reviews" | "seo";

export interface VariantAttribute {
  name: string;
  value: string;
}

export interface BulkActionResult {
  success: number;
  failed: number;
  errors: Array<{ id: string; message: string }>;
}
