import { Prisma, CategoryStatus } from "@prisma/client";
import { prisma } from "../../config/database";

export class CategoryRepository {
  async findMany(params: {
    skip: number;
    limit: number;
    search?: string;
    status?: CategoryStatus;
    parentId?: string;
    featured?: boolean;
  }) {
    const where: Prisma.CategoryWhereInput = { deletedAt: null };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { slug: { contains: params.search, mode: "insensitive" } },
      ];
    }
    if (params.status) where.status = params.status;
    if (params.parentId) where.parentId = params.parentId;
    if (params.featured !== undefined) where.isFeatured = params.featured;

    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          _count: { select: { products: true, children: true } },
        },
      }),
      prisma.category.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: true,
        children: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
        _count: { select: { products: true } },
      },
    });
  }

  findBySlug(slug: string) {
    return prisma.category.findFirst({ where: { slug, deletedAt: null } });
  }

  create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
  }

  update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  countAll() {
    return prisma.category.count({ where: { deletedAt: null } });
  }

  getTree() {
    return prisma.category.findMany({
      where: { deletedAt: null, parentId: null },
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
          include: {
            children: {
              where: { deletedAt: null },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });
  }

  findHomepage() {
    return prisma.category.findMany({
      where: { deletedAt: null, status: "ACTIVE", isFeatured: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        sortOrder: true,
      },
    });
  }

  findPublicActive() {
    return prisma.category.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        sortOrder: true,
      },
    });
  }
}

export const categoryRepository = new CategoryRepository();
