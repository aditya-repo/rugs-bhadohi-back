import { z } from "zod";

const hexSchema = z
  .string()
  .trim()
  .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, "Use a hex colour like #FFFFFF");

export const createColorSchema = z.object({
  name: z.string().trim().min(1).max(100),
  hex: hexSchema,
  sortOrder: z.number().int().optional(),
  status: z.enum(["ACTIVE", "DRAFT", "INACTIVE"]).optional(),
});

export const updateColorSchema = createColorSchema.partial();

export const colorQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "DRAFT", "INACTIVE"]).optional(),
});

export type CreateColorInput = z.infer<typeof createColorSchema>;
export type UpdateColorInput = z.infer<typeof updateColorSchema>;
