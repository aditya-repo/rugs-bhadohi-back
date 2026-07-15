import { z } from "zod";

export const globalSearchSchema = z.object({
  q: z.string().min(1),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
