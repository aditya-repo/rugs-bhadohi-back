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

  findFeaturedProducts(limit = 8) {
    return prisma.product.findMany({
      where: {
        deletedAt: null,
        status: "PUBLISHED",
        isFeatured: true,
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        brand: true,
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

  findPublicByIdOrSlug(idOrSlug: string) {
    return prisma.product.findFirst({
      where: {
        deletedAt: null,
        status: "PUBLISHED",
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        description: true,
        brand: true,
        collection: true,
        designer: true,
        origin: true,
        careInstructions: true,
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: true,
        category: { select: { id: true, name: true, slug: true } },
        images: {
          orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
          select: { path: true, alt: true, isFeatured: true },
        },
        variants: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            sku: true,
            price: true,
            salePrice: true,
            stock: true,
            thumbnail: true,
            attributes: true,
          },
        },
        _count: { select: { reviews: true } },
      },
    });
  }

  private static parseCsv(value?: string): string[] {
    if (!value?.trim()) return [];
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  private static attributeFilter(
    keys: string[],
    values: string[],
  ): Prisma.ProductWhereInput | undefined {
    if (values.length === 0) return undefined;
    return {
      OR: values.flatMap((value) =>
        keys.map((key) => ({
          variants: {
            some: {
              status: "ACTIVE" as const,
              attributes: { path: [key], equals: value },
            },
          },
        })),
      ),
    };
  }

  async findPublicCatalog(params: {
    skip: number;
    limit: number;
    search?: string;
    categorySlug?: string;
    collectionSlug?: string;
    shape?: string;
    material?: string;
    technique?: string;
    pattern?: string;
    thickness?: string;
    size?: string;
    color?: string;
    sort?: "featured" | "newest" | "title";
  }) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      status: "PUBLISHED",
    };

    const andClauses: Prisma.ProductWhereInput[] = [];

    if (params.search) {
      andClauses.push({
        OR: [
          { title: { contains: params.search, mode: "insensitive" } },
          { slug: { contains: params.search, mode: "insensitive" } },
          { shortDescription: { contains: params.search, mode: "insensitive" } },
          { brand: { contains: params.search, mode: "insensitive" } },
        ],
      });
    }

    const categorySlugs = ProductRepository.parseCsv(params.categorySlug);
    if (categorySlugs.length > 0) {
      andClauses.push({ category: { slug: { in: categorySlugs } } });
    }

    const collectionSlugs = ProductRepository.parseCsv(params.collectionSlug);
    if (collectionSlugs.length > 0) {
      const collections = await prisma.collection.findMany({
        where: { slug: { in: collectionSlugs }, status: "ACTIVE", deletedAt: null },
        select: { title: true },
      });
      const titles = collections.map((c) => c.title).filter(Boolean);
      if (titles.length === 0) {
        return { items: [], total: 0 };
      }
      andClauses.push({
        OR: titles.map((title) => ({
          collection: { contains: title, mode: "insensitive" as const },
        })),
      });
    }

    const attributeClauses = [
      ProductRepository.attributeFilter(["shape"], ProductRepository.parseCsv(params.shape)),
      ProductRepository.attributeFilter(["material"], ProductRepository.parseCsv(params.material)),
      ProductRepository.attributeFilter(
        ["technique", "weavingType"],
        ProductRepository.parseCsv(params.technique),
      ),
      ProductRepository.attributeFilter(
        ["style", "patternArt", "pattern"],
        ProductRepository.parseCsv(params.pattern),
      ),
      ProductRepository.attributeFilter(["thickness"], ProductRepository.parseCsv(params.thickness)),
      ProductRepository.attributeFilter(["size"], ProductRepository.parseCsv(params.size)),
      ProductRepository.attributeFilter(["color"], ProductRepository.parseCsv(params.color)),
    ].filter(Boolean) as Prisma.ProductWhereInput[];

    andClauses.push(...attributeClauses);

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      params.sort === "title"
        ? [{ title: "asc" }]
        : params.sort === "newest"
          ? [{ createdAt: "desc" }]
          : [{ isFeatured: "desc" }, { createdAt: "desc" }];

    const select = {
      id: true,
      title: true,
      slug: true,
      shortDescription: true,
      brand: true,
      collection: true,
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: true,
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: [{ isFeatured: "desc" as const }, { sortOrder: "asc" as const }], take: 1 },
      variants: {
        where: { status: "ACTIVE" as const },
        orderBy: { createdAt: "asc" as const },
        take: 1,
        select: {
          price: true,
          salePrice: true,
          attributes: true,
        },
      },
      _count: { select: { reviews: true } },
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy,
        select,
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total };
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
