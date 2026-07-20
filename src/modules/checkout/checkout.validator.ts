import { z } from "zod";

const checkoutAddressSchema = z.object({
  label: z.string().max(50).optional().nullable(),
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
});

const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional().nullable(),
  quantity: z.coerce.number().int().min(1).max(20),
  /** Client unit price is advisory; server recalculates from catalog. */
  unitPrice: z.coerce.number().min(0).optional(),
  servicesPerUnit: z.coerce.number().min(0).default(0),
  serviceLabels: z.array(z.string()).max(20).optional(),
  title: z.string().max(255).optional(),
});

export const createCheckoutSessionSchema = z.object({
  email: z.string().email(),
  address: checkoutAddressSchema,
  items: z.array(checkoutItemSchema).min(1).max(50),
});

export const verifyCheckoutSchema = z.object({
  email: z.string().email(),
  orderId: z.string().min(1),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;
export type VerifyCheckoutInput = z.infer<typeof verifyCheckoutSchema>;
