import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../../config/database";

export class ProductRepository {
  async findMany(params: {
    skip: number;
    limit: number;
    search?: string;
    status?: ProductStatus;
    categoryId?: string;
    featured?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const where: Prisma.ProductWhereInput = { deletedAt: null };
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { slug: { contains: params.search, mode: "insensitive" } },
        { skuPrefix: { contains: params.search, mode: "insensitive" } },
        { variants: { some: { sku: { contains: params.search, mode: "insensitive" } } } },
      ];
    }
    if (params.status) where.status = params.status;
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.featured !== undefined) where.isFeatured = params.featured;

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    const sortField = params.sortBy ?? "updatedAt";
    orderBy[sortField as keyof Prisma.ProductOrderByWithRelationInput] = params.sortOrder ?? "desc";

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          variants: { select: { id: true, sku: true, price: true, salePrice: true, stock: true, status: true } },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        seo: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { createdAt: "asc" } },
        slugHistory: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  findBySlug(slug: string) {
    return prisma.product.findFirst({ where: { slug, deletedAt: null } });
  }

  findArtistCollection() {
    return prisma.product.findMany({
      where: {
        deletedAt: null,
        status: "PUBLISHED",
        designer: "Artist Collection",
      },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        collection: true,
        images: { orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }], take: 1 },
        variants: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: {
            price: true,
            salePrice: true,
            attributes: true,
          },
        },
      },
    });
  }

  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({
      data,
      include: { seo: true, variants: true, images: true, category: true },
    });
  }

  update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({
      where: { id },
      data,
      include: { seo: true, variants: true, images: true, category: true },
    });
  }

  softDelete(id: string) {
    return prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  bulkUpdateStatus(ids: string[], status: ProductStatus) {
    return prisma.product.updateMany({ where: { id: { in: ids }, deletedAt: null }, data: { status } });
  }

  bulkUpdateCategory(ids: string[], categoryId: string | null) {
    return prisma.product.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { categoryId },
    });
  }

  bulkSoftDelete(ids: string[]) {
    return prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
  }

  addSlugHistory(productId: string, slug: string) {
    return prisma.slugHistory.create({ data: { productId, slug } });
  }

  upsertSeo(productId: string, data: Prisma.ProductSEOCreateWithoutProductInput) {
    return prisma.productSEO.upsert({
      where: { productId },
      create: { productId, ...data },
      update: data,
    });
  }

  addImage(data: Prisma.ProductImageCreateWithoutProductInput & { productId: string }) {
    return prisma.productImage.create({
      data: { productId: data.productId, path: data.path, thumbnail: data.thumbnail, alt: data.alt, sortOrder: data.sortOrder, isFeatured: data.isFeatured },
    });
  }

  updateImage(id: string, data: Prisma.ProductImageUpdateInput) {
    return prisma.productImage.update({ where: { id }, data });
  }

  deleteImage(id: string) {
    return prisma.productImage.delete({ where: { id } });
  }

  findImage(id: string) {
    return prisma.productImage.findUnique({ where: { id } });
  }

  countByStatus() {
    return prisma.product.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true });
  }

  countOutOfStock() {
    return prisma.product.count({
      where: {
        deletedAt: null,
        status: "PUBLISHED",
        variants: { every: { stock: 0 } },
      },
    });
  }

  getLowStock(threshold = 5) {
    return prisma.productVariant.findMany({
      where: { stock: { lte: threshold, gt: 0 }, status: "ACTIVE", product: { deletedAt: null } },
      include: { product: { select: { id: true, title: true, slug: true } } },
      orderBy: { stock: "asc" },
      take: 20,
    });
  }

  getTopSelling(limit = 10) {
    return prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });
  }

  replaceVariants(productId: string, variants: Prisma.ProductVariantCreateManyInput[]) {
    return prisma.$transaction([
      prisma.productVariant.deleteMany({ where: { productId } }),
      prisma.productVariant.createMany({ data: variants }),
    ]);
  }

  upsertVariant(id: string | undefined, productId: string, data: Prisma.ProductVariantUncheckedCreateInput) {
    if (id) {
      return prisma.productVariant.update({ where: { id }, data });
    }
    return prisma.productVariant.create({ data: { ...data, productId } });
  }
}

export const productRepository = new ProductRepository();
