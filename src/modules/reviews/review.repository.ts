import { Prisma, ReviewStatus } from "@prisma/client";
import { prisma } from "../../config/database";

export class ReviewRepository {
  async findMany(params: {
    skip: number;
    limit: number;
    search?: string;
    status?: ReviewStatus;
    rating?: number;
    verified?: boolean;
  }) {
    const where: Prisma.ReviewWhereInput = {};
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { content: { contains: params.search, mode: "insensitive" } },
        { product: { title: { contains: params.search, mode: "insensitive" } } },
        { customer: { email: { contains: params.search, mode: "insensitive" } } },
      ];
    }
    if (params.status) where.status = params.status;
    if (params.rating) where.rating = params.rating;
    if (params.verified !== undefined) where.isVerifiedPurchase = params.verified;

    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { id: true, title: true, slug: true } },
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          images: true,
        },
      }),
      prisma.review.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return prisma.review.findUnique({
      where: { id },
      include: {
        product: true,
        customer: true,
        images: true,
        order: { select: { id: true, orderNumber: true } },
      },
    });
  }

  approve(id: string) {
    return prisma.review.update({
      where: { id },
      data: { status: "APPROVED", rejectionReason: null },
    });
  }

  reject(id: string, reason: string) {
    return prisma.review.update({
      where: { id },
      data: { status: "REJECTED", rejectionReason: reason },
    });
  }

  updateStatus(id: string, status: ReviewStatus) {
    return prisma.review.update({ where: { id }, data: { status } });
  }

  addReply(id: string, reply: string) {
    return prisma.review.update({ where: { id }, data: { adminReply: reply, repliedAt: new Date() } });
  }

  delete(id: string) {
    return prisma.review.delete({ where: { id } });
  }
}

export const reviewRepository = new ReviewRepository();
