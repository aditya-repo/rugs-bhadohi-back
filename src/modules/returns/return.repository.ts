import { Prisma, ReturnStatus, ReturnType } from "@prisma/client";
import { prisma } from "../../config/database";

export class ReturnRepository {
  async findMany(params: {
    skip: number;
    limit: number;
    search?: string;
    status?: ReturnStatus;
    type?: ReturnType;
  }) {
    const where: Prisma.ReturnRequestWhereInput = {};
    if (params.search) {
      where.OR = [
        { requestNumber: { contains: params.search, mode: "insensitive" } },
        { order: { orderNumber: { contains: params.search, mode: "insensitive" } } },
        { customer: { email: { contains: params.search, mode: "insensitive" } } },
      ];
    }
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;

    const [items, total] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: { select: { id: true, orderNumber: true, total: true } },
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          images: true,
        },
      }),
      prisma.returnRequest.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: { include: { items: true } },
        customer: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
        images: true,
        admin: { select: { id: true, name: true } },
      },
    });
  }

  update(id: string, data: Prisma.ReturnRequestUpdateInput, status?: ReturnStatus, note?: string) {
    const ops: Prisma.PrismaPromise<unknown>[] = [prisma.returnRequest.update({ where: { id }, data })];
    if (status) {
      ops.push(prisma.returnStatusHistory.create({ data: { returnId: id, status, note } }));
    }
    return prisma.$transaction(ops);
  }
}

export const returnRepository = new ReturnRepository();
