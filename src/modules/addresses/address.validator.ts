import { z } from "zod";

export const addressEmailQuerySchema = z.object({
  email: z.string().email(),
});

export const upsertAddressSchema = z.object({
  email: z.string().email(),
  label: z.enum(["home", "work", "other"]).optional().nullable(),
  fullName: z.string().min(1).max(120),
  phone: z.string().min(8).max(30),
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional().nullable(),
  landmark: z.string().max(255).optional().nullable(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(3).max(20),
  country: z.string().min(1).max(100),
  countryCode: z.string().min(2).max(3).optional().nullable(),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = upsertAddressSchema.extend({
  id: z.string().min(1),
});

export const addressIdBodySchema = z.object({
  email: z.string().email(),
  id: z.string().min(1),
});

export type UpsertAddressInput = z.infer<typeof upsertAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type AddressIdBody = z.infer<typeof addressIdBodySchema>;
