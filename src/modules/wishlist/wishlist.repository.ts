import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

const wishlistProductSelect = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  brand: true,
  collection: true,
  isFeatured: true,
  isNewArrival: true,
  isBestSeller: true,
  category: { select: { id: true, name: true, slug: true } },
  images: {
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }] as Prisma.ProductImageOrderByWithRelationInput[],
    take: 1,
  },
  variants: {
    where: { status: "ACTIVE" as const },
    orderBy: { createdAt: "asc" as const },
    take: 1,
    select: {
      price: true,
      salePrice: true,
      attributes: true,
    },
  },
  _count: { select: { reviews: true } },
} satisfies Prisma.ProductSelect;

export class WishlistRepository {
  findCustomerIdByEmail(email: string) {
    return prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
  }

  findProductId(productId: string) {
    return prisma.product.findFirst({
      where: { id: productId, deletedAt: null, status: "PUBLISHED" },
      select: { id: true },
    });
  }

  listProductIds(customerId: string) {
    return prisma.wishlistItem.findMany({
      where: {
        customerId,
        product: { deletedAt: null, status: "PUBLISHED" },
      },
      orderBy: { createdAt: "desc" },
      select: { productId: true },
    });
  }

  listProducts(customerId: string) {
    return prisma.wishlistItem.findMany({
      where: {
        customerId,
        product: { deletedAt: null, status: "PUBLISHED" },
      },
      orderBy: { createdAt: "desc" },
      select: {
        productId: true,
        createdAt: true,
        product: { select: wishlistProductSelect },
      },
    });
  }

  findItem(customerId: string, productId: string) {
    return prisma.wishlistItem.findUnique({
      where: {
        customerId_productId: { customerId, productId },
      },
      select: { id: true },
    });
  }

  add(customerId: string, productId: string) {
    return prisma.wishlistItem.upsert({
      where: {
        customerId_productId: { customerId, productId },
      },
      create: { customerId, productId },
      update: {},
      select: { productId: true },
    });
  }

  remove(customerId: string, productId: string) {
    return prisma.wishlistItem.deleteMany({
      where: { customerId, productId },
    });
  }
}

export const wishlistRepository = new WishlistRepository();
