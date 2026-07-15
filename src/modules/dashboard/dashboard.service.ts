import { prisma } from "../../config/database";
import { decimalToNumber } from "../../utils/helpers";
import { productRepository } from "../products/product.repository";
import { categoryRepository } from "../categories/category.repository";
import { activityService } from "../../services/activity.service";

export class DashboardRepository {
  async getOrderStats() {
    const [total, pending, completed, cancelled] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.order.count({ where: { status: "CANCELLED" } }),
    ]);
    return { total, pending, completed, cancelled };
  }

  async getReturnStats() {
    const [returns, exchanges, pending] = await Promise.all([
      prisma.returnRequest.count({ where: { type: "RETURN" } }),
      prisma.returnRequest.count({ where: { type: "EXCHANGE" } }),
      prisma.returnRequest.count({ where: { status: "PENDING" } }),
    ]);
    return { returns, exchanges, pending };
  }

  async getReviewStats() {
    const [total, pending, avgRating] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.review.aggregate({ _avg: { rating: true }, where: { status: "APPROVED" } }),
    ]);
    return { total, pending, averageRating: avgRating._avg.rating ?? 0 };
  }

  async getRevenue() {
    const delivered = await prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: ["DELIVERED", "SHIPPED", "CONFIRMED", "PACKED"] } },
    });
    return decimalToNumber(delivered._sum.total);
  }

  async getMonthlySales(months = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate }, status: { not: "CANCELLED" } },
      select: { total: true, createdAt: true },
    });

    const monthly: Record<string, number> = {};
    for (const order of orders) {
      const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`;
      monthly[key] = (monthly[key] ?? 0) + decimalToNumber(order.total);
    }
    return Object.entries(monthly).map(([month, revenue]) => ({ month, revenue }));
  }

  async getLatestOrders(limit = 4) {
    return prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { items: true } },
      },
    });
  }

  async getLatestCustomers(limit = 10) {
    return prisma.customer.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        totalSpend: true,
        createdAt: true,
        status: true,
      },
    });
  }

  async getLatestReviews(limit = 10) {
    return prisma.review.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, title: true } },
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getTopCategories(limit = 5) {
    return prisma.product.groupBy({
      by: ["categoryId"],
      where: { deletedAt: null, categoryId: { not: null } },
      _count: true,
      orderBy: { _count: { categoryId: "desc" } },
      take: limit,
    });
  }

  async getCustomerCount() {
    return prisma.customer.count();
  }
}

export const dashboardRepository = new DashboardRepository();

export class DashboardService {
  async getOverview() {
    const statusCounts = await productRepository.countByStatus();
    const productStats = {
      total: statusCounts.reduce((sum, s) => sum + s._count, 0),
      active: statusCounts.find((s) => s.status === "PUBLISHED")?._count ?? 0,
      draft: statusCounts.find((s) => s.status === "DRAFT")?._count ?? 0,
      archived: statusCounts.find((s) => s.status === "ARCHIVED")?._count ?? 0,
      outOfStock: await productRepository.countOutOfStock(),
    };

    const [orderStats, returnStats, reviewStats, revenue, categories, customers] = await Promise.all([
      dashboardRepository.getOrderStats(),
      dashboardRepository.getReturnStats(),
      dashboardRepository.getReviewStats(),
      dashboardRepository.getRevenue(),
      categoryRepository.countAll(),
      dashboardRepository.getCustomerCount(),
    ]);

    return {
      products: productStats,
      categories,
      orders: orderStats,
      returns: returnStats,
      customers,
      reviews: reviewStats,
      revenue,
    };
  }

  async getAnalytics() {
    const [monthlySales, topSelling, topCategories, lowStock, recentActivities] = await Promise.all([
      dashboardRepository.getMonthlySales(),
      productRepository.getTopSelling(),
      dashboardRepository.getTopCategories(),
      productRepository.getLowStock(),
      activityService.getRecent(20),
    ]);

    const topProducts = await Promise.all(
      topSelling.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, title: true, slug: true, images: { take: 1 } },
        });
        return { product, quantitySold: item._sum.quantity ?? 0 };
      }),
    );

    const topCats = await Promise.all(
      topCategories.map(async (item) => {
        if (!item.categoryId) return null;
        const category = await prisma.category.findUnique({
          where: { id: item.categoryId },
          select: { id: true, name: true, slug: true },
        });
        return { category, productCount: item._count };
      }),
    );

    return {
      monthlySales,
      topSellingProducts: topProducts.filter(Boolean),
      topCategories: topCats.filter(Boolean),
      lowStockProducts: lowStock,
      recentActivities,
    };
  }

  async getLatest() {
    const [orders, customers, reviews] = await Promise.all([
      dashboardRepository.getLatestOrders(),
      dashboardRepository.getLatestCustomers(),
      dashboardRepository.getLatestReviews(),
    ]);
    return { orders, customers, reviews };
  }
}

export const dashboardService = new DashboardService();
