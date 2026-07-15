import { Prisma, CollectionStatus } from "@prisma/client";
import { prisma } from "../../config/database";

export class CollectionRepository {
  async findMany(params: {
    skip: number;
    limit: number;
    search?: string;
    status?: CollectionStatus;
  }) {
    const where: Prisma.CollectionWhereInput = { deletedAt: null };
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { slug: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      }),
      prisma.collection.count({ where }),
    ]);

    const withCounts = await Promise.all(
      items.map(async (item) => {
        const products = await prisma.product.count({
          where: {
            deletedAt: null,
            collection: { contains: item.title },
          },
        });
        return { ...item, _count: { products } };
      }),
    );

    return { items: withCounts, total };
  }

  findById(id: string) {
    return prisma.collection.findFirst({ where: { id, deletedAt: null } });
  }

  findBySlug(slug: string) {
    return prisma.collection.findFirst({ where: { slug, deletedAt: null } });
  }

  findActiveTitles() {
    return prisma.collection.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: { id: true, title: true, slug: true, image: true, description: true },
    });
  }

  findPublicHomepage() {
    return prisma.collection.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        image: true,
        sortOrder: true,
      },
    });
  }

  create(data: Prisma.CollectionCreateInput) {
    return prisma.collection.create({ data });
  }

  update(id: string, data: Prisma.CollectionUpdateInput) {
    return prisma.collection.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return prisma.collection.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const collectionRepository = new CollectionRepository();
