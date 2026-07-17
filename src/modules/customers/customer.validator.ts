import { z } from "zod";

export const customerQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const updateCustomerStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]),
});

export const syncCustomerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional().default(""),
  image: z.string().max(2000).optional().nullable(),
});

export const updateCustomerProfileSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional().default(""),
  phone: z.string().max(30).optional().nullable(),
  gender: z.string().max(40).optional().nullable(),
  dateOfBirth: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
    z.literal(""),
    z.null(),
  ]).optional(),
  image: z.string().max(2000).optional().nullable(),
});

export const customerMeQuerySchema = z.object({
  email: z.string().email(),
});

export type SyncCustomerInput = z.infer<typeof syncCustomerSchema>;
export type UpdateCustomerProfileInput = z.infer<typeof updateCustomerProfileSchema>;
