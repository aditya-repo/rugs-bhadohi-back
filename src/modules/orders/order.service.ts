import fs from "fs/promises";
import path from "path";
import { NotFoundError } from "../../utils/errors";
import { generateInvoiceNumber, parsePagination, decimalToNumber } from "../../utils/helpers";
import { activityService } from "../../services/activity.service";
import { orderRepository } from "./order.repository";
import type { UpdateOrderStatusInput } from "./order.validator";

function variantSizeLabel(variant: {
  length: unknown;
  width: unknown;
  attributes: unknown;
} | null): string {
  if (!variant) return "";
  const length = decimalToNumber(variant.length as never);
  const width = decimalToNumber(variant.width as never);
  if (length > 0 && width > 0) {
    return `${length} x ${width}`;
  }
  const attrs = variant.attributes;
  if (attrs && typeof attrs === "object" && !Array.isArray(attrs)) {
    const record = attrs as Record<string, unknown>;
    const size = record.size ?? record.sizeLabel;
    if (typeof size === "string" && size.trim()) return size.trim();
  }
  return "";
}

function mapCustomerOrderStatus(
  status: string,
  paymentStatus: string,
): "delivered" | "shipped" | "processing" | "cancelled" | "failed" | "pending_payment" {
  if (paymentStatus === "FAILED") return "failed";
  if (paymentStatus === "PENDING" && status === "PENDING") return "pending_payment";
  switch (status) {
    case "DELIVERED":
      return "delivered";
    case "SHIPPED":
      return "shipped";
    case "CANCELLED":
    case "RETURNED":
    case "REFUNDED":
      return "cancelled";
    default:
      return "processing";
  }
}

export class OrderService {
  async list(query: Record<string, string | undefined>) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await orderRepository.findMany({
      skip,
      limit,
      search: query.search,
      status: query.status as UpdateOrderStatusInput["status"] | undefined,
      paymentStatus: query.paymentStatus as "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "COD" | undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder as "asc" | "desc" | undefined,
    });
    return { items, page, limit, total };
  }

  async listRecentForCustomer(email: string, limitRaw?: string) {
    const limit = Math.min(20, Math.max(1, parseInt(limitRaw ?? "10", 10) || 10));
    const orders = await orderRepository.findRecentByCustomerEmail(email, limit);

    return orders.map((order) => {
      const first = order.items[0] ?? null;
      const extraCount = Math.max(0, order._count.items - 1);
      const imagePath =
        first?.variant?.thumbnail ||
        first?.product.images[0]?.path ||
        "";
      const productName = first?.title || first?.product.title || "Order item";
      const size = variantSizeLabel(first?.variant ?? null);
      const status = mapCustomerOrderStatus(order.status, order.paymentStatus);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        date: order.createdAt.toISOString(),
        productName:
          extraCount > 0 ? `${productName} +${extraCount} more` : productName,
        size,
        itemCount: order._count.items,
        total: decimalToNumber(order.total),
        currency: order.currency,
        imageSrc: imagePath,
        imageAlt: first?.product.images[0]?.alt || productName,
        status,
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
        actionLabel: order.status === "SHIPPED" ? "Track Order" : "View Details",
      };
    });
  }

  async getById(id: string) {
    const order = await orderRepository.findById(id);
    if (!order) throw new NotFoundError("Order not found");
    return order;
  }

  async updateStatus(id: string, input: UpdateOrderStatusInput, adminId?: string) {
    await this.getById(id);
    await orderRepository.updateStatus(id, input.status, input.note);
    await activityService.log({
      adminId,
      action: "UPDATE_STATUS",
      entity: "order",
      entityId: id,
      metadata: { status: input.status },
    });
    return orderRepository.findById(id);
  }

  async addNote(id: string, note: string, adminId?: string, isInternal = true) {
    await this.getById(id);
    return orderRepository.addNote(id, note, adminId, isInternal);
  }

  async generateInvoice(id: string, adminId?: string) {
    const order = await this.getById(id);
    const invoiceNumber = order.invoiceNumber ?? generateInvoiceNumber("INV");
    const invoiceDir = path.resolve(process.cwd(), "storage", "invoices");
    await fs.mkdir(invoiceDir, { recursive: true });

    const invoiceContent = this.buildInvoiceHtml(order, invoiceNumber);
    const invoicePath = path.join(invoiceDir, `${invoiceNumber}.html`);
    await fs.writeFile(invoicePath, invoiceContent, "utf-8");

    const relativePath = path.join("storage", "invoices", `${invoiceNumber}.html`).replace(/\\/g, "/");
    await orderRepository.updateInvoice(id, invoiceNumber, relativePath);

    await activityService.log({ adminId, action: "GENERATE_INVOICE", entity: "order", entityId: id });
    return { invoiceNumber, invoicePath: relativePath };
  }

  private buildInvoiceHtml(order: Awaited<ReturnType<typeof orderRepository.findById>>, invoiceNumber: string): string {
    const items = order!.items
      .map(
        (item) =>
          `<tr><td>${item.title}</td><td>${item.sku}</td><td>${item.quantity}</td><td>₹${decimalToNumber(item.price)}</td><td>₹${decimalToNumber(item.total)}</td></tr>`,
      )
      .join("");

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice ${invoiceNumber}</title>
<style>body{font-family:sans-serif;padding:40px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}</style>
</head><body>
<h1>Invoice ${invoiceNumber}</h1>
<p>Order: ${order!.orderNumber}</p>
<p>Customer: ${order!.customer.firstName} ${order!.customer.lastName} (${order!.customer.email})</p>
<p>Date: ${order!.createdAt.toISOString().split("T")[0]}</p>
<table><thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
<tbody>${items}</tbody></table>
<p><strong>Subtotal:</strong> ₹${decimalToNumber(order!.subtotal)}</p>
<p><strong>Tax:</strong> ₹${decimalToNumber(order!.tax)}</p>
<p><strong>Shipping:</strong> ₹${decimalToNumber(order!.shippingCost)}</p>
<p><strong>Total:</strong> ₹${decimalToNumber(order!.total)}</p>
</body></html>`;
  }
}

export const orderService = new OrderService();
