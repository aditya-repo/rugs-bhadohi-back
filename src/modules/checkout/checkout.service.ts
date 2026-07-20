import { decimalToNumber, generateOrderNumber } from "../../utils/helpers";
import { AppError, NotFoundError, ValidationError } from "../../utils/errors";
import { env, primaryFrontendUrl } from "../../config/env";
import { logger } from "../../config/logger";
import {
  getCashfreeClient,
  getCashfreeEnv,
  isCashfreeConfigured,
  normalizeCashfreePhone,
} from "../../lib/cashfree";
import { checkoutRepository } from "./checkout.repository";
import type {
  CreateCheckoutSessionInput,
  VerifyCheckoutInput,
} from "./checkout.validator";

function isIndiaAddress(country: string, countryCode?: string | null): boolean {
  const code = (countryCode ?? "").trim().toUpperCase();
  if (code === "IN") return true;
  const name = country.trim().toLowerCase();
  return name === "india" || name === "in" || name === "bharat";
}

function countryCodeForStore(country: string, countryCode?: string | null): string {
  const code = (countryCode ?? "").trim().toUpperCase();
  if (code) return code;
  return isIndiaAddress(country, countryCode) ? "IN" : country.slice(0, 2).toUpperCase();
}

function lineUnitPrice(salePrice: number | null, price: number): number {
  if (salePrice != null && salePrice > 0 && salePrice < price) return salePrice;
  return price;
}

export class CheckoutService {
  async createSession(input: CreateCheckoutSessionInput) {
    const customer = await checkoutRepository.findCustomerByEmail(input.email);
    if (!customer) {
      throw new NotFoundError("Customer not found. Please sign in again.");
    }

    const india = isIndiaAddress(input.address.country, input.address.countryCode);
    const gateway = india ? "cashfree" : "stripe";

    if (!india) {
      return {
        gateway: "stripe" as const,
        mode: null,
        orderId: null,
        orderNumber: null,
        paymentSessionId: null,
        amount: null,
        currency: null,
        message:
          "International checkout via Stripe is coming soon. Please use an India shipping address for Cashfree, or contact support.",
      };
    }

    if (!isCashfreeConfigured()) {
      throw new AppError(
        503,
        "Cashfree payment gateway is not configured on the server.",
        "CASHFREE_NOT_CONFIGURED",
      );
    }

    const resolvedItems: Array<{
      productId: string;
      variantId: string | null;
      title: string;
      sku: string;
      quantity: number;
      price: number;
      total: number;
    }> = [];

    let subtotal = 0;

    for (const line of input.items) {
      const product = await checkoutRepository.findProductWithVariants(line.productId);
      if (!product) {
        throw new ValidationError(`Product not found: ${line.productId}`);
      }

      let variant =
        (line.variantId
          ? product.variants.find((v) => v.id === line.variantId)
          : null) ?? product.variants.find((v) => v.status === "ACTIVE") ?? product.variants[0];

      if (!variant) {
        throw new ValidationError(`No sellable variant for product ${product.title}`);
      }

      const catalogPrice = lineUnitPrice(
        decimalToNumber(variant.salePrice),
        decimalToNumber(variant.price),
      );
      const services = Number(line.servicesPerUnit ?? 0);
      const unit = catalogPrice + services;
      const lineTotal = unit * line.quantity;
      subtotal += lineTotal;

      const serviceNote =
        line.serviceLabels && line.serviceLabels.length > 0
          ? ` · ${line.serviceLabels.join(", ")}`
          : "";

      resolvedItems.push({
        productId: product.id,
        variantId: variant.id,
        title: line.title?.trim() || `${product.title}${serviceNote}`,
        sku: variant.sku,
        quantity: line.quantity,
        price: unit,
        total: lineTotal,
      });
    }

    const total = Math.round(subtotal * 100) / 100;
    if (total < 1) {
      throw new ValidationError("Order total must be at least ₹1");
    }

    const orderNumber = generateOrderNumber();
    const phone = normalizeCashfreePhone(input.address.phone);
    if (phone.length < 10) {
      throw new ValidationError("A valid 10-digit phone number is required for payment");
    }

    const order = await checkoutRepository.createCheckoutOrder({
      orderNumber,
      customerId: customer.id,
      subtotal: total,
      total,
      currency: "INR",
      paymentGateway: gateway,
      paymentMethod: "CASHFREE",
      cashfreeOrderId: orderNumber,
      notes:
        input.address.landmark?.trim()
          ? `Landmark: ${input.address.landmark.trim()}`
          : null,
      address: {
        fullName: input.address.fullName,
        phone: input.address.phone,
        label: input.address.label,
        line1: input.address.line1,
        line2: input.address.line2,
        landmark: input.address.landmark,
        city: input.address.city,
        state: input.address.state,
        postalCode: input.address.postalCode,
        country: input.address.country,
        countryCode: countryCodeForStore(input.address.country, input.address.countryCode),
      },
      items: resolvedItems,
    });

    const returnUrl = `${primaryFrontendUrl}/checkout/return?order_id={order_id}`;
    // Cashfree requires HTTPS for notify_url; skip on local http and rely on
    // return-URL verify + dashboard webhook (or a tunneled HTTPS APP_URL).
    const notifyUrl = env.APP_URL.startsWith("https://")
      ? `${env.APP_URL}/api/v1/checkout/webhook/cashfree`
      : undefined;

    const cashfree = getCashfreeClient();
    try {
      const response = await cashfree.PGCreateOrder({
        order_id: orderNumber,
        order_amount: total,
        order_currency: "INR",
        customer_details: {
          customer_id: customer.id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 50) || orderNumber,
          customer_email: customer.email,
          customer_phone: phone,
          customer_name:
            [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim() ||
            input.address.fullName,
        },
        order_meta: {
          return_url: returnUrl,
          ...(notifyUrl ? { notify_url: notifyUrl } : {}),
        },
        order_note: `Rug Casa ${orderNumber}`,
        order_tags: {
          internal_order_id: order.id,
        },
      });

      const paymentSessionId = response.data.payment_session_id;
      if (!paymentSessionId) {
        throw new AppError(502, "Cashfree did not return a payment session", "CASHFREE_ERROR");
      }

      await checkoutRepository.updateCashfreeSession(order.id, paymentSessionId);

      return {
        gateway: "cashfree" as const,
        mode: getCashfreeEnv(),
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentSessionId,
        amount: total,
        currency: "INR",
        message: "Cashfree payment session created",
      };
    } catch (error) {
      logger.error("Cashfree PGCreateOrder failed", {
        orderNumber,
        error: error instanceof Error ? error.message : error,
        response: (error as { response?: { data?: unknown } })?.response?.data,
      });
      await checkoutRepository.markFailed(
        order.id,
        "Cashfree session creation failed",
      );
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (error instanceof Error ? error.message : "Failed to create Cashfree order");
      throw new AppError(502, message, "CASHFREE_ERROR");
    }
  }

  async verifyPayment(input: VerifyCheckoutInput) {
    const customer = await checkoutRepository.findCustomerByEmail(input.email);
    if (!customer) throw new NotFoundError("Customer not found");

    const order = await checkoutRepository.findByOrderNumber(input.orderId);
    if (!order || order.customerId !== customer.id) {
      throw new NotFoundError("Order not found");
    }

    if (order.paymentStatus === "PAID") {
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        status: order.status,
        amount: decimalToNumber(order.total),
        currency: order.currency,
      };
    }

    if (order.paymentGateway !== "cashfree" || !order.cashfreeOrderId) {
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        status: order.status,
        amount: decimalToNumber(order.total),
        currency: order.currency,
      };
    }

    const cashfree = getCashfreeClient();
    const [orderRes, paymentsRes] = await Promise.all([
      cashfree.PGFetchOrder(order.cashfreeOrderId),
      cashfree.PGOrderFetchPayments(order.cashfreeOrderId).catch(() => null),
    ]);

    const orderStatus = orderRes.data.order_status ?? "";
    const payments = paymentsRes?.data ?? [];
    const hasSuccess = payments.some(
      (p) => (p.payment_status ?? "").toUpperCase() === "SUCCESS",
    );
    const hasFailed = payments.some((p) =>
      ["FAILED", "USER_DROPPED", "CANCELLED"].includes(
        (p.payment_status ?? "").toUpperCase(),
      ),
    );

    if (orderStatus === "PAID" || hasSuccess) {
      const updated = await checkoutRepository.markPaid(
        order.id,
        "Payment verified via Cashfree order status",
      );
      return {
        orderId: updated!.id,
        orderNumber: updated!.orderNumber,
        paymentStatus: updated!.paymentStatus,
        status: updated!.status,
        amount: decimalToNumber(updated!.total),
        currency: updated!.currency,
      };
    }

    if (hasFailed || orderStatus === "EXPIRED" || orderStatus === "TERMINATED") {
      const updated = await checkoutRepository.markFailed(
        order.id,
        `Cashfree payment not successful (${orderStatus || "FAILED"})`,
      );
      return {
        orderId: updated!.id,
        orderNumber: updated!.orderNumber,
        paymentStatus: updated!.paymentStatus,
        status: updated!.status,
        amount: decimalToNumber(updated!.total),
        currency: updated!.currency,
      };
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      status: order.status,
      amount: decimalToNumber(order.total),
      currency: order.currency,
    };
  }

  async handleCashfreeWebhook(rawBody: string, signature: string, timestamp: string) {
    const cashfree = getCashfreeClient();
    let event: { type?: string; data?: Record<string, unknown> };
    try {
      event = cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp) as {
        type?: string;
        data?: Record<string, unknown>;
      };
    } catch (error) {
      logger.warn("Cashfree webhook signature verification failed", {
        error: error instanceof Error ? error.message : error,
      });
      throw new AppError(401, "Invalid webhook signature", "INVALID_WEBHOOK_SIGNATURE");
    }

    const type = String(event.type ?? "").toUpperCase();
    const data = event.data ?? {};
    const orderPayload = (data.order ?? {}) as Record<string, unknown>;
    const paymentPayload = (data.payment ?? {}) as Record<string, unknown>;

    const cashfreeOrderId = String(
      orderPayload.order_id ?? paymentPayload.order_id ?? "",
    );
    if (!cashfreeOrderId) {
      logger.warn("Cashfree webhook missing order_id", { type, data });
      return { received: true, processed: false };
    }

    const order = await checkoutRepository.findByCashfreeOrderId(cashfreeOrderId);
    if (!order) {
      logger.warn("Cashfree webhook for unknown order", { cashfreeOrderId, type });
      return { received: true, processed: false };
    }

    const paymentStatus = String(paymentPayload.payment_status ?? "").toUpperCase();
    const success =
      type.includes("SUCCESS") ||
      type === "PAYMENT_SUCCESS_WEBHOOK" ||
      paymentStatus === "SUCCESS" ||
      String(orderPayload.order_status ?? "").toUpperCase() === "PAID";

    const failed =
      type.includes("FAILED") ||
      type.includes("USER_DROPPED") ||
      ["FAILED", "USER_DROPPED", "CANCELLED"].includes(paymentStatus);

    if (success) {
      await checkoutRepository.markPaid(
        order.id,
        `Cashfree webhook: ${type || "PAYMENT_SUCCESS"}`,
      );
      return { received: true, processed: true, orderNumber: order.orderNumber };
    }

    if (failed) {
      await checkoutRepository.markFailed(
        order.id,
        `Cashfree webhook: ${type || paymentStatus || "FAILED"}`,
      );
      return { received: true, processed: true, orderNumber: order.orderNumber };
    }

    logger.info("Cashfree webhook ignored", { type, cashfreeOrderId });
    return { received: true, processed: false, orderNumber: order.orderNumber };
  }
}

export const checkoutService = new CheckoutService();
