import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

export class OrderRepository {
  async findMany(params: {
    skip: number;
    limit: number;
    search?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const where: Prisma.OrderWhereInput = {};
    if (params.search) {
      where.OR = [
        { orderNumber: { contains: params.search, mode: "insensitive" } },
        { customer: { email: { contains: params.search, mode: "insensitive" } } },
        { customer: { firstName: { contains: params.search, mode: "insensitive" } } },
        { customer: { lastName: { contains: params.search, mode: "insensitive" } } },
      ];
    }
    if (params.status) where.status = params.status;
    if (params.paymentStatus) where.paymentStatus = params.paymentStatus;

    const orderBy: Prisma.OrderOrderByWithRelationInput = {};
    orderBy[(params.sortBy ?? "createdAt") as keyof Prisma.OrderOrderByWithRelationInput] = params.sortOrder ?? "desc";

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy,
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: { select: { id: true, title: true, slug: true } }, variant: true } },
        statusHistory: { orderBy: { createdAt: "asc" } },
        orderNotes: { orderBy: { createdAt: "desc" }, include: { admin: { select: { id: true, name: true } } } },
        shippingAddress: true,
        billingAddress: true,
        returnRequests: true,
      },
    });
  }

  findRecentByCustomerEmail(email: string, limit: number) {
    return prisma.order.findMany({
      where: {
        customer: { email: email.toLowerCase() },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                images: {
                  orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
                  take: 1,
                  select: { path: true, alt: true },
                },
              },
            },
            variant: {
              select: {
                id: true,
                sku: true,
                thumbnail: true,
                length: true,
                width: true,
                attributes: true,
              },
            },
          },
        },
        _count: { select: { items: true } },
      },
    });
  }

  updateStatus(id: string, status: OrderStatus, note?: string) {
    return prisma.$transaction([
      prisma.order.update({ where: { id }, data: { status } }),
      prisma.orderStatusHistory.create({ data: { orderId: id, status, note } }),
    ]);
  }

  addNote(orderId: string, note: string, adminId?: string, isInternal = true) {
    return prisma.orderNote.create({ data: { orderId, note, adminId, isInternal } });
  }

  updateInvoice(id: string, invoiceNumber: string, invoicePath?: string) {
    return prisma.order.update({ where: { id }, data: { invoiceNumber, invoicePath } });
  }
}

export const orderRepository = new OrderRepository();
