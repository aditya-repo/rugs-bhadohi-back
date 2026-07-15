import { z } from "zod";

export const updateProductSeoSchema = z.object({
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  canonicalUrl: z.string().optional(),
  metaRobots: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().optional(),
  structuredData: z.record(z.unknown()).optional(),
  sitemapPriority: z.number().min(0).max(1).optional(),
  changeFrequency: z.string().optional(),
  redirectUrl: z.string().optional(),
  previewUrl: z.string().optional(),
});

export const slugPreviewSchema = z.object({
  title: z.string().min(1),
});

export type UpdateProductSeoInput = z.infer<typeof updateProductSeoSchema>;
