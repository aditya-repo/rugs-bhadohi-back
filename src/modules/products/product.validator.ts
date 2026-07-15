import { z } from "zod";

const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  price: z.number().positive(),
  salePrice: z.number().positive().optional().nullable(),
  costPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  reserved: z.number().int().min(0).default(0),
  weight: z.number().optional().nullable(),
  length: z.number().optional().nullable(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  thumbnail: z.string().optional(),
  attributes: z.record(z.string()).optional(),
});

const seoSchema = z.object({
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

export const createProductSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().optional(),
  skuPrefix: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  collection: z.string().optional(),
  designer: z.string().optional(),
  origin: z.string().optional(),
  brand: z.string().optional(),
  careInstructions: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  seo: seoSchema.optional(),
  variants: z.array(variantSchema).min(1),
});

export const updateProductSchema = createProductSchema.partial().extend({
  variants: z.array(variantSchema).optional(),
});

export const productQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  categoryId: z.string().optional(),
  featured: z.enum(["true", "false"]).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const bulkIdsSchema = z.object({
  ids: z.array(z.string()).min(1),
});

export const bulkCategorySchema = z.object({
  ids: z.array(z.string()).min(1),
  categoryId: z.string().nullable(),
});

export const reorderImagesSchema = z.object({
  images: z.array(z.object({
    id: z.string(),
    sortOrder: z.number().int(),
    isFeatured: z.boolean().optional(),
  })),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
