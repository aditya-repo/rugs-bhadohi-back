import { prisma } from "../../config/database";
import type { CartLineInput } from "./cart.validator";

export class CartRepository {
  findCustomerIdByEmail(email: string) {
    return prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
  }

  findCartWithItems(customerId: string) {
    return prisma.cart.findUnique({
      where: { customerId },
      include: {
        items: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  async ensureCart(customerId: string) {
    return prisma.cart.upsert({
      where: { customerId },
      create: { customerId },
      update: {},
      include: {
        items: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  async replaceItems(customerId: string, items: CartLineInput[]) {
    return prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { customerId },
        create: { customerId },
        update: {},
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      if (items.length > 0) {
        await tx.cartItem.createMany({
          data: items.map((item) => ({
            cartId: cart.id,
            lineKey: item.key,
            productId: item.productId,
            name: item.name,
            brand: item.brand,
            imageSrc: item.imageSrc,
            imageAlt: item.imageAlt,
            sizeId: item.sizeId,
            sizeLabel: item.sizeLabel,
            colorId: item.colorId,
            colorLabel: item.colorLabel,
            unitPrice: item.unitPrice,
            unitMrp: item.unitMrp,
            quantity: item.quantity,
            serviceIds: item.serviceIds,
            serviceLabels: item.serviceLabels,
            servicesPerUnit: item.servicesPerUnit,
          })),
        });
      }

      return tx.cart.findUniqueOrThrow({
        where: { id: cart.id },
        include: { items: { orderBy: { createdAt: "asc" } } },
      });
    });
  }

  async upsertLine(customerId: string, item: CartLineInput) {
    const cart = await this.ensureCart(customerId);
    await prisma.cartItem.upsert({
      where: {
        cartId_lineKey: { cartId: cart.id, lineKey: item.key },
      },
      create: {
        cartId: cart.id,
        lineKey: item.key,
        productId: item.productId,
        name: item.name,
        brand: item.brand,
        imageSrc: item.imageSrc,
        imageAlt: item.imageAlt,
        sizeId: item.sizeId,
        sizeLabel: item.sizeLabel,
        colorId: item.colorId,
        colorLabel: item.colorLabel,
        unitPrice: item.unitPrice,
        unitMrp: item.unitMrp,
        quantity: item.quantity,
        serviceIds: item.serviceIds,
        serviceLabels: item.serviceLabels,
        servicesPerUnit: item.servicesPerUnit,
      },
      update: {
        productId: item.productId,
        name: item.name,
        brand: item.brand,
        imageSrc: item.imageSrc,
        imageAlt: item.imageAlt,
        sizeId: item.sizeId,
        sizeLabel: item.sizeLabel,
        colorId: item.colorId,
        colorLabel: item.colorLabel,
        unitPrice: item.unitPrice,
        unitMrp: item.unitMrp,
        quantity: item.quantity,
        serviceIds: item.serviceIds,
        serviceLabels: item.serviceLabels,
        servicesPerUnit: item.servicesPerUnit,
      },
    });

    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    });

    return this.findCartWithItems(customerId);
  }

  async updateQuantity(customerId: string, lineKey: string, quantity: number) {
    const cart = await this.findCartWithItems(customerId);
    if (!cart) return null;

    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id, lineKey },
      });
    } else {
      await prisma.cartItem.updateMany({
        where: { cartId: cart.id, lineKey },
        data: { quantity },
      });
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    });

    return this.findCartWithItems(customerId);
  }

  async removeLine(customerId: string, lineKey: string) {
    const cart = await this.findCartWithItems(customerId);
    if (!cart) return null;

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, lineKey },
    });
    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    });

    return this.findCartWithItems(customerId);
  }

  async clear(customerId: string) {
    const cart = await this.ensureCart(customerId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.findCartWithItems(customerId);
  }
}

export const cartRepository = new CartRepository();
