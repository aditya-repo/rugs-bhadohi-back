import { z } from "zod";

export const createBannerSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["HOMEPAGE", "CATEGORY", "OFFER", "COLLECTION", "POPUP", "MOBILE", "DESKTOP"]),
  image: z.string().min(1),
  mobileImage: z.string().optional(),
  linkUrl: z.string().optional(),
  buttonText: z.string().optional(),
  buttonUrl: z.string().optional(),
  sortOrder: z.number().int().optional(),
  status: z.enum(["ENABLED", "DISABLED", "SCHEDULED"]).optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

export const updateBannerSchema = createBannerSchema.partial();

export const bannerQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: z.enum(["HOMEPAGE", "CATEGORY", "OFFER", "COLLECTION", "POPUP", "MOBILE", "DESKTOP"]).optional(),
  status: z.enum(["ENABLED", "DISABLED", "SCHEDULED"]).optional(),
});

export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
