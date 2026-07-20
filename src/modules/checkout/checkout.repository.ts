import { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

export class CheckoutRepository {
  findCustomerByEmail(email: string) {
    return prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  findProductWithVariants(productId: string) {
    return prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      include: {
        variants: true,
      },
    });
  }

  createCheckoutOrder(data: {
    orderNumber: string;
    customerId: string;
    subtotal: number;
    total: number;
    currency: string;
    paymentGateway: string;
    paymentMethod: "CASHFREE" | "STRIPE";
    cashfreeOrderId?: string | null;
    notes?: string | null;
    address: {
      fullName: string;
      phone: string;
      label?: string | null;
      line1: string;
      line2?: string | null;
      landmark?: string | null;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      countryCode?: string | null;
    };
    items: Array<{
      productId: string;
      variantId: string | null;
      title: string;
      sku: string;
      quantity: number;
      price: number;
      total: number;
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
      const address = await tx.address.create({
        data: {
          customerId: data.customerId,
          label: data.address.label ?? null,
          fullName: data.address.fullName,
          phone: data.address.phone,
          line1: data.address.line1,
          line2: data.address.line2 ?? null,
          landmark: data.address.landmark ?? null,
          city: data.address.city,
          state: data.address.state,
          postalCode: data.address.postalCode,
          country: data.address.country,
          countryCode: data.address.countryCode ?? null,
          isDefault: false,
        },
      });

      const order = await tx.order.create({
        data: {
          orderNumber: data.orderNumber,
          customerId: data.customerId,
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: data.paymentMethod,
          paymentGateway: data.paymentGateway,
          cashfreeOrderId: data.cashfreeOrderId ?? null,
          subtotal: data.subtotal,
          discount: 0,
          tax: 0,
          shippingCost: 0,
          total: data.total,
          currency: data.currency,
          shippingAddressId: address.id,
          billingAddressId: address.id,
          notes: data.notes ?? null,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              title: item.title,
              sku: item.sku,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
            })),
          },
          statusHistory: {
            create: {
              status: "PENDING",
              note: `Checkout started via ${data.paymentGateway}`,
            },
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      return order;
    });
  }

  updateCashfreeSession(orderId: string, paymentSessionId: string) {
    return prisma.order.update({
      where: { id: orderId },
      data: { cashfreePaymentSessionId: paymentSessionId },
    });
  }

  findByOrderNumber(orderNumber: string) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        customer: true,
      },
    });
  }

  findByCashfreeOrderId(cashfreeOrderId: string) {
    return prisma.order.findFirst({
      where: {
        OR: [{ cashfreeOrderId }, { orderNumber: cashfreeOrderId }],
      },
      include: {
        items: true,
        customer: true,
      },
    });
  }

  async markPaid(orderId: string, note: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!existing) return null;
      if (existing.paymentStatus === PaymentStatus.PAID) {
        return existing;
      }

      for (const item of existing.items) {
        if (!item.variantId) continue;
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: "CONFIRMED",
          paidAt: new Date(),
          statusHistory: {
            create: {
              status: "CONFIRMED",
              note,
            },
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });
    });
  }

  async markFailed(orderId: string, note: string) {
    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) return null;
    if (existing.paymentStatus === PaymentStatus.PAID) return existing;

    return prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        statusHistory: {
          create: {
            status: existing.status,
            note,
          },
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });
  }
}

export const checkoutRepository = new CheckoutRepository();

export type CheckoutOrder = Prisma.OrderGetPayload<{
  include: { items: true; customer: true };
}>;
