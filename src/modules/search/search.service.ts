import { prisma } from "../../config/database";
import { parsePagination } from "../../utils/helpers";

export class SearchService {
  async searchProducts(query: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null,
      OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { slug: { contains: query, mode: "insensitive" as const } },
        { skuPrefix: { contains: query, mode: "insensitive" as const } },
      ],
    };
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { category: { select: { id: true, name: true } }, images: { take: 1 } },
      }),
      prisma.product.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async searchOrders(query: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = {
      OR: [
        { orderNumber: { contains: query, mode: "insensitive" as const } },
        { customer: { email: { contains: query, mode: "insensitive" as const } } },
      ],
    };
    const [items, total] = await Promise.all([
      prisma.order.findMany({ where, skip, take: limit, include: { customer: { select: { firstName: true, lastName: true, email: true } } } }),
      prisma.order.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async searchCustomers(query: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = {
      OR: [
        { email: { contains: query, mode: "insensitive" as const } },
        { firstName: { contains: query, mode: "insensitive" as const } },
        { lastName: { contains: query, mode: "insensitive" as const } },
      ],
    };
    const [items, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take: limit }),
      prisma.customer.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async searchCategories(query: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null,
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { slug: { contains: query, mode: "insensitive" as const } },
      ],
    };
    const [items, total] = await Promise.all([
      prisma.category.findMany({ where, skip, take: limit }),
      prisma.category.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async searchReviews(query: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = {
      OR: [
        { content: { contains: query, mode: "insensitive" as const } },
        { product: { title: { contains: query, mode: "insensitive" as const } } },
      ],
    };
    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        include: { product: { select: { title: true } }, customer: { select: { firstName: true, lastName: true } } },
      }),
      prisma.review.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async globalSearch(q: string) {
    const { page, limit } = parsePagination({ page: "1", limit: "5" });
    const [products, orders, customers, categories, reviews] = await Promise.all([
      this.searchProducts(q, page, limit),
      this.searchOrders(q, page, limit),
      this.searchCustomers(q, page, limit),
      this.searchCategories(q, page, limit),
      this.searchReviews(q, page, limit),
    ]);
    return { products, orders, customers, categories, reviews };
  }
}

export const searchService = new SearchService();
