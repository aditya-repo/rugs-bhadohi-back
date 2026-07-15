import { BannerStatus, BannerType, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

export class BannerRepository {
  async findMany(params: { skip: number; limit: number; type?: BannerType; status?: BannerStatus }) {
    const where: Prisma.BannerWhereInput = {};
    if (params.type) where.type = params.type;
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      prisma.banner.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      prisma.banner.count({ where }),
    ]);
    return { items, total };
  }

  findActiveHomepage(limit: number, now = new Date()) {
    return prisma.banner.findMany({
      where: {
        type: "HOMEPAGE",
        status: "ENABLED",
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
    });
  }

  countHomepage() {
    return prisma.banner.count({ where: { type: "HOMEPAGE" } });
  }

  findById(id: string) {
    return prisma.banner.findUnique({ where: { id } });
  }

  create(data: Prisma.BannerCreateInput) {
    return prisma.banner.create({ data });
  }

  update(id: string, data: Prisma.BannerUpdateInput) {
    return prisma.banner.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.banner.delete({ where: { id } });
  }
}

export const bannerRepository = new BannerRepository();
