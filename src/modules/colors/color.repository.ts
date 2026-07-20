import { Prisma, ColorStatus } from "@prisma/client";
import { prisma } from "../../config/database";

export class ColorRepository {
  async findMany(params: {
    skip: number;
    limit: number;
    search?: string;
    status?: ColorStatus;
  }) {
    const where: Prisma.ColorWhereInput = { deletedAt: null };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { hex: { contains: params.search, mode: "insensitive" } },
      ];
    }
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      prisma.color.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.color.count({ where }),
    ]);

    return { items, total };
  }

  countActive() {
    return prisma.color.count({ where: { deletedAt: null } });
  }

  findById(id: string) {
    return prisma.color.findFirst({ where: { id, deletedAt: null } });
  }

  findByName(name: string) {
    return prisma.color.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, deletedAt: null },
    });
  }

  findActive() {
    return prisma.color.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, hex: true, sortOrder: true },
    });
  }

  create(data: Prisma.ColorCreateInput) {
    return prisma.color.create({ data });
  }

  update(id: string, data: Prisma.ColorUpdateInput) {
    return prisma.color.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return prisma.color.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async upsertDefaults(
    defaults: ReadonlyArray<{ name: string; hex: string }>,
  ) {
    for (let i = 0; i < defaults.length; i++) {
      const item = defaults[i];
      await prisma.color.upsert({
        where: { name: item.name },
        update: {
          hex: item.hex.toUpperCase(),
          sortOrder: i + 1,
          status: "ACTIVE",
          deletedAt: null,
        },
        create: {
          name: item.name,
          hex: item.hex.toUpperCase(),
          sortOrder: i + 1,
          status: "ACTIVE",
        },
      });
    }
  }
}

export const colorRepository = new ColorRepository();
