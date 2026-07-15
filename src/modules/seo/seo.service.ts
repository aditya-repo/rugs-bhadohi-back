import { NotFoundError } from "../../utils/errors";
import { generateUniqueSlug, slugify } from "../../utils/helpers";
import { productRepository } from "../products/product.repository";
import { toJsonValue } from "../../utils/prisma";
import type { UpdateProductSeoInput } from "./seo.validator";

export class SeoService {
  async getProductSeo(productId: string) {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError("Product not found");
    return {
      product: { id: product.id, title: product.title, slug: product.slug },
      seo: product.seo,
      slugHistory: product.slugHistory,
    };
  }

  async updateProductSeo(productId: string, input: UpdateProductSeoInput) {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError("Product not found");
    return productRepository.upsertSeo(productId, {
      ...input,
      structuredData: toJsonValue(input.structuredData),
    });
  }

  async generateSlug(title: string, excludeId?: string) {
    const slug = await generateUniqueSlug(title, async (s) => {
      const found = await productRepository.findBySlug(s);
      return found !== null && found.id !== excludeId;
    });
    return { slug, previewUrl: `/products/${slug}` };
  }

  async previewSlug(title: string) {
    return { slug: slugify(title), previewUrl: `/products/${slugify(title)}` };
  }
}

export const seoService = new SeoService();
