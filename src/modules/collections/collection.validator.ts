import { z } from "zod";

export const createCollectionSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  status: z.enum(["ACTIVE", "DRAFT", "INACTIVE"]).optional(),
});

export const updateCollectionSchema = createCollectionSchema.partial();

export const collectionQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "DRAFT", "INACTIVE"]).optional(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
