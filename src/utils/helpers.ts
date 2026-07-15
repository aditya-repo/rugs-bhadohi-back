export function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = slugify(base);
  if (!slug) slug = "item";
  let candidate = slug;
  let counter = 1;
  while (await exists(candidate)) {
    candidate = `${slug}-${counter}`;
    counter += 1;
  }
  return candidate;
}

export function generateOrderNumber(): string {
  const prefix = "RC";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export function generateReturnNumber(): string {
  const prefix = "RET";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export function generateInvoiceNumber(prefix = "INV"): string {
  const range = 100000 + Math.floor(Math.random() * 900000);
  return `${prefix}-${range}`;
}

export function parsePagination(query: {
  page?: string;
  limit?: string;
}): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20", 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function decimalToNumber(value: PrismaDecimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

type PrismaDecimal = { toString(): string };

export function generateSku(prefix: string, index: number): string {
  const cleanPrefix = prefix.replace(/[^A-Z0-9-]/gi, "").toUpperCase() || "SKU";
  return `${cleanPrefix}-${String(index).padStart(4, "0")}`;
}

export function generateRandomToken(length = 64): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
