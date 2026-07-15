import { Prisma, ProductStatus } from "@prisma/client";
import { NotFoundError, ConflictError } from "../../utils/errors";
import { generateUniqueSlug, parsePagination } from "../../utils/helpers";
import { toJsonValue } from "../../utils/prisma";
import { activityService } from "../../services/activity.service";
import { mediaService } from "../../services/media.service";
import { productRepository } from "./product.repository";
import type { CreateProductInput, UpdateProductInput } from "./product.validator";

export class ProductService {
  async list(query: Record<string, string | undefined>) {
    const { page, limit, skip } = parsePagination(query);
    const featured = query.featured === "true" ? true : query.featured === "false" ? false : undefined;
    const { items, total } = await productRepository.findMany({
      skip,
      limit,
      search: query.search,
      status: query.status as ProductStatus | undefined,
      categoryId: query.categoryId,
      featured,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder as "asc" | "desc" | undefined,
    });
    return { items, page, limit, total };
  }

  async getById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) throw new NotFoundError("Product not found");
    return product;
  }

  async listPublicArtistCollection() {
    return productRepository.findArtistCollection();
  }

  private buildSeoData(seo?: CreateProductInput["seo"]): Prisma.ProductSEOCreateWithoutProductInput | undefined {
    if (!seo) return undefined;
    return {
      seoTitle: seo.seoTitle,
      seoDescription: seo.seoDescription,
      seoKeywords: seo.seoKeywords,
      canonicalUrl: seo.canonicalUrl,
      metaRobots: seo.metaRobots,
      ogTitle: seo.ogTitle,
      ogDescription: seo.ogDescription,
      ogImage: seo.ogImage,
      twitterTitle: seo.twitterTitle,
      twitterDescription: seo.twitterDescription,
      twitterImage: seo.twitterImage,
      structuredData: toJsonValue(seo.structuredData),
      sitemapPriority: seo.sitemapPriority,
      changeFrequency: seo.changeFrequency,
      redirectUrl: seo.redirectUrl,
      previewUrl: seo.previewUrl,
    };
  }

  async create(input: CreateProductInput, adminId?: string) {
    const slug = input.slug
      ? input.slug
      : await generateUniqueSlug(input.title, async (s) => !!(await productRepository.findBySlug(s)));

    const existing = await productRepository.findBySlug(slug);
    if (existing) throw new ConflictError("Product slug already exists");

    const seoData = this.buildSeoData(input.seo);

    const product = await productRepository.create({
      title: input.title,
      slug,
      skuPrefix: input.skuPrefix,
      shortDescription: input.shortDescription,
      description: input.description,
      category: input.categoryId ? { connect: { id: input.categoryId } } : undefined,
      collection: input.collection,
      designer: input.designer,
      origin: input.origin,
      brand: input.brand,
      careInstructions: input.careInstructions,
      isFeatured: input.isFeatured ?? false,
      isTrending: input.isTrending ?? false,
      isNewArrival: input.isNewArrival ?? false,
      isBestSeller: input.isBestSeller ?? false,
      status: input.status ?? "DRAFT",
      seo: seoData ? { create: seoData } : undefined,
      variants: {
        create: input.variants.map((v) => ({
          sku: v.sku,
          barcode: v.barcode,
          price: v.price,
          salePrice: v.salePrice,
          costPrice: v.costPrice,
          stock: v.stock,
          reserved: v.reserved,
          weight: v.weight,
          length: v.length,
          width: v.width,
          height: v.height,
          status: v.status ?? "ACTIVE",
          thumbnail: v.thumbnail,
          attributes: v.attributes ?? undefined,
        })),
      },
    });

    await activityService.log({ adminId, action: "CREATE", entity: "product", entityId: product.id });
    return product;
  }

  async update(id: string, input: UpdateProductInput, adminId?: string) {
    const existing = await this.getById(id);

    let slug = input.slug;
    if (input.title && !input.slug) {
      slug = await generateUniqueSlug(input.title, async (s) => {
        const found = await productRepository.findBySlug(s);
        return found !== null && found.id !== id;
      });
    }

    if (slug && slug !== existing.slug) {
      await productRepository.addSlugHistory(id, existing.slug);
    }

    await productRepository.update(id, {
      title: input.title,
      slug,
      skuPrefix: input.skuPrefix,
      shortDescription: input.shortDescription,
      description: input.description,
      category: input.categoryId !== undefined
        ? input.categoryId
          ? { connect: { id: input.categoryId } }
          : { disconnect: true }
        : undefined,
      collection: input.collection,
      designer: input.designer,
      origin: input.origin,
      brand: input.brand,
      careInstructions: input.careInstructions,
      isFeatured: input.isFeatured,
      isTrending: input.isTrending,
      isNewArrival: input.isNewArrival,
      isBestSeller: input.isBestSeller,
      status: input.status,
    });

    if (input.seo) {
      await productRepository.upsertSeo(id, this.buildSeoData(input.seo)!);
    }

    if (input.variants) {
      await productRepository.replaceVariants(
        id,
        input.variants.map((v) => ({
          productId: id,
          sku: v.sku,
          barcode: v.barcode,
          price: v.price,
          salePrice: v.salePrice,
          costPrice: v.costPrice,
          stock: v.stock,
          reserved: v.reserved,
          weight: v.weight,
          length: v.length,
          width: v.width,
          height: v.height,
          status: v.status ?? "ACTIVE",
          thumbnail: v.thumbnail,
          attributes: v.attributes ?? undefined,
        })),
      );
    }

    await activityService.log({ adminId, action: "UPDATE", entity: "product", entityId: id });
    return productRepository.findById(id);
  }

  async delete(id: string, adminId?: string) {
    await this.getById(id);
    await productRepository.softDelete(id);
    await activityService.log({ adminId, action: "DELETE", entity: "product", entityId: id });
    return { message: "Product deleted" };
  }

  async duplicate(id: string, adminId?: string) {
    const source = await this.getById(id);
    const slug = await generateUniqueSlug(`${source.title}-copy`, async (s) => !!(await productRepository.findBySlug(s)));

    const product = await productRepository.create({
      title: `${source.title} (Copy)`,
      slug,
      skuPrefix: source.skuPrefix ? `${source.skuPrefix}-COPY` : undefined,
      shortDescription: source.shortDescription ?? undefined,
      description: source.description ?? undefined,
      category: source.categoryId ? { connect: { id: source.categoryId } } : undefined,
      collection: source.collection ?? undefined,
      designer: source.designer ?? undefined,
      origin: source.origin ?? undefined,
      brand: source.brand ?? undefined,
      careInstructions: source.careInstructions ?? undefined,
      isFeatured: false,
      isTrending: false,
      isNewArrival: false,
      isBestSeller: false,
      status: "DRAFT",
      seo: source.seo
        ? {
            create: {
              seoTitle: source.seo.seoTitle ?? undefined,
              seoDescription: source.seo.seoDescription ?? undefined,
              seoKeywords: source.seo.seoKeywords ?? undefined,
              canonicalUrl: source.seo.canonicalUrl ?? undefined,
              metaRobots: source.seo.metaRobots ?? undefined,
              ogTitle: source.seo.ogTitle ?? undefined,
              ogDescription: source.seo.ogDescription ?? undefined,
              ogImage: source.seo.ogImage ?? undefined,
              twitterTitle: source.seo.twitterTitle ?? undefined,
              twitterDescription: source.seo.twitterDescription ?? undefined,
              twitterImage: source.seo.twitterImage ?? undefined,
              structuredData: source.seo.structuredData ?? undefined,
              sitemapPriority: source.seo.sitemapPriority ?? undefined,
              changeFrequency: source.seo.changeFrequency ?? undefined,
              redirectUrl: source.seo.redirectUrl ?? undefined,
              previewUrl: source.seo.previewUrl ?? undefined,
            },
          }
        : undefined,
      variants: {
        create: source.variants.map((v, i) => ({
          sku: `${v.sku}-COPY-${i + 1}`,
          barcode: v.barcode ?? undefined,
          price: v.price,
          salePrice: v.salePrice,
          costPrice: v.costPrice,
          stock: 0,
          reserved: 0,
          weight: v.weight,
          length: v.length,
          width: v.width,
          height: v.height,
          status: v.status,
          thumbnail: v.thumbnail ?? undefined,
          attributes: v.attributes ?? undefined,
        })),
      },
    });

    await activityService.log({ adminId, action: "DUPLICATE", entity: "product", entityId: product.id });
    return product;
  }

  async publish(id: string, adminId?: string) {
    await productRepository.update(id, { status: "PUBLISHED" });
    await activityService.log({ adminId, action: "PUBLISH", entity: "product", entityId: id });
    return this.getById(id);
  }

  async draft(id: string, adminId?: string) {
    await productRepository.update(id, { status: "DRAFT" });
    await activityService.log({ adminId, action: "DRAFT", entity: "product", entityId: id });
    return this.getById(id);
  }

  async archive(id: string, adminId?: string) {
    await productRepository.update(id, { status: "ARCHIVED" });
    await activityService.log({ adminId, action: "ARCHIVE", entity: "product", entityId: id });
    return this.getById(id);
  }

  async bulkDelete(ids: string[], adminId?: string) {
    const result = await productRepository.bulkSoftDelete(ids);
    await activityService.log({ adminId, action: "BULK_DELETE", entity: "product", metadata: { ids } });
    return { deleted: result.count };
  }

  async bulkPublish(ids: string[], adminId?: string) {
    const result = await productRepository.bulkUpdateStatus(ids, "PUBLISHED");
    await activityService.log({ adminId, action: "BULK_PUBLISH", entity: "product", metadata: { ids } });
    return { updated: result.count };
  }

  async bulkDraft(ids: string[], adminId?: string) {
    const result = await productRepository.bulkUpdateStatus(ids, "DRAFT");
    await activityService.log({ adminId, action: "BULK_DRAFT", entity: "product", metadata: { ids } });
    return { updated: result.count };
  }

  async bulkCategoryUpdate(ids: string[], categoryId: string | null, adminId?: string) {
    const result = await productRepository.bulkUpdateCategory(ids, categoryId);
    await activityService.log({ adminId, action: "BULK_CATEGORY", entity: "product", metadata: { ids, categoryId } });
    return { updated: result.count };
  }

  async uploadImages(productId: string, files: Express.Multer.File[], adminId?: string) {
    await this.getById(productId);
    const processed = await mediaService.processMultiple(files, "products");

    const existingCount = (await productRepository.findById(productId))?.images.length ?? 0;
    const images = await Promise.all(
      processed.map((img, i) =>
        productRepository.addImage({
          productId,
          path: img.relativePath,
          thumbnail: img.relativeThumbnail,
          sortOrder: existingCount + i,
          isFeatured: existingCount === 0 && i === 0,
        }),
      ),
    );

    await activityService.log({ adminId, action: "UPLOAD_IMAGES", entity: "product", entityId: productId });
    return images;
  }

  async reorderImages(
    productId: string,
    images: Array<{ id: string; sortOrder: number; isFeatured?: boolean }>,
  ) {
    await this.getById(productId);
    await Promise.all(
      images.map((img) =>
        productRepository.updateImage(img.id, {
          sortOrder: img.sortOrder,
          isFeatured: img.isFeatured,
        }),
      ),
    );
    return productRepository.findById(productId);
  }

  async deleteImage(productId: string, imageId: string, adminId?: string) {
    const image = await productRepository.findImage(imageId);
    if (!image || image.productId !== productId) throw new NotFoundError("Image not found");
    await mediaService.deleteImage(image.path);
    await productRepository.deleteImage(imageId);
    await activityService.log({ adminId, action: "DELETE_IMAGE", entity: "product", entityId: productId });
    return { message: "Image deleted" };
  }

  async exportProducts(query: Record<string, string | undefined>) {
    const { items } = await this.list({ ...query, limit: "10000", page: "1" });
    return items;
  }
}

export const productService = new ProductService();
