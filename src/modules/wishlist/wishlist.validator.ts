import { z } from "zod";

export const wishlistEmailQuerySchema = z.object({
  email: z.string().email(),
});

export const wishlistProductBodySchema = z.object({
  email: z.string().email(),
  productId: z.string().min(1),
});

export type WishlistProductBody = z.infer<typeof wishlistProductBodySchema>;
