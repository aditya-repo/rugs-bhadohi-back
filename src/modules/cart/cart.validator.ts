import { z } from "zod";

export const cartEmailQuerySchema = z.object({
  email: z.string().email(),
});

const cartLineSchema = z.object({
  key: z.string().min(1).max(255),
  productId: z.string().min(1),
  name: z.string().min(1).max(255),
  brand: z.string().max(120).default(""),
  imageSrc: z.string().max(2000).default(""),
  imageAlt: z.string().max(255).default(""),
  sizeId: z.string().min(1).max(120),
  sizeLabel: z.string().max(120).default(""),
  colorId: z.string().max(120).default(""),
  colorLabel: z.string().max(120).default(""),
  unitPrice: z.coerce.number().min(0),
  unitMrp: z.coerce.number().min(0),
  quantity: z.coerce.number().int().min(1).max(20),
  serviceIds: z.array(z.string()).max(20).default([]),
  serviceLabels: z.array(z.string()).max(20).default([]),
  servicesPerUnit: z.coerce.number().min(0).default(0),
});

export const replaceCartSchema = z.object({
  email: z.string().email(),
  items: z.array(cartLineSchema).max(50),
});

export const upsertCartLineSchema = z.object({
  email: z.string().email(),
  item: cartLineSchema,
});

export const updateCartQtySchema = z.object({
  email: z.string().email(),
  key: z.string().min(1),
  quantity: z.coerce.number().int().min(0).max(20),
});

export const removeCartLineSchema = z.object({
  email: z.string().email(),
  key: z.string().min(1),
});

export type ReplaceCartInput = z.infer<typeof replaceCartSchema>;
export type UpsertCartLineInput = z.infer<typeof upsertCartLineSchema>;
export type UpdateCartQtyInput = z.infer<typeof updateCartQtySchema>;
export type RemoveCartLineInput = z.infer<typeof removeCartLineSchema>;
export type CartLineInput = z.infer<typeof cartLineSchema>;
