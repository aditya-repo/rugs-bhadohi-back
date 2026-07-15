import { CustomerStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

export class CustomerRepository {
  async findMany(params: {
    skip: number;
    limit: number;
    search?: string;
    status?: CustomerStatus;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const where: Prisma.CustomerWhereInput = {};
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: "insensitive" } },
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { phone: { contains: params.search, mode: "insensitive" } },
      ];
    }
    if (params.status) where.status = params.status;

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {};
    orderBy[(params.sortBy ?? "createdAt") as keyof Prisma.CustomerOrderByWithRelationInput] = params.sortOrder ?? "desc";

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy,
        include: { _count: { select: { orders: true, reviews: true } } },
      }),
      prisma.customer.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: { orderBy: { createdAt: "desc" }, take: 20, include: { _count: { select: { items: true } } } },
        reviews: { orderBy: { createdAt: "desc" }, include: { product: { select: { id: true, title: true } } } },
        wishlistItems: { include: { product: { select: { id: true, title: true, slug: true, images: { take: 1 } } } } },
        returnRequests: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  updateStatus(id: string, status: CustomerStatus) {
    return prisma.customer.update({ where: { id }, data: { status } });
  }
}

export const customerRepository = new CustomerRepository();
