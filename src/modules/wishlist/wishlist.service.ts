import { NotFoundError } from "../../utils/errors";
import { wishlistRepository } from "./wishlist.repository";

export class WishlistService {
  private async requireCustomerId(email: string) {
    const customer = await wishlistRepository.findCustomerIdByEmail(email);
    if (!customer) throw new NotFoundError("Customer not found");
    return customer.id;
  }

  private async findCustomerId(email: string) {
    const customer = await wishlistRepository.findCustomerIdByEmail(email);
    return customer?.id ?? null;
  }

  async listIds(email: string) {
    const customerId = await this.findCustomerId(email);
    if (!customerId) return { productIds: [] as string[] };
    const rows = await wishlistRepository.listProductIds(customerId);
    return { productIds: rows.map((r) => r.productId) };
  }

  async list(email: string) {
    const customerId = await this.findCustomerId(email);
    if (!customerId) return [];
    const rows = await wishlistRepository.listProducts(customerId);
    return rows.map((row) => row.product);
  }

  async add(email: string, productId: string) {
    const customerId = await this.requireCustomerId(email);
    const product = await wishlistRepository.findProductId(productId);
    if (!product) throw new NotFoundError("Product not found");
    await wishlistRepository.add(customerId, productId);
    return { productId, wishlisted: true as const };
  }

  async remove(email: string, productId: string) {
    const customerId = await this.requireCustomerId(email);
    await wishlistRepository.remove(customerId, productId);
    return { productId, wishlisted: false as const };
  }

  async toggle(email: string, productId: string) {
    const customerId = await this.requireCustomerId(email);
    const product = await wishlistRepository.findProductId(productId);
    if (!product) throw new NotFoundError("Product not found");

    const existing = await wishlistRepository.findItem(customerId, productId);
    if (existing) {
      await wishlistRepository.remove(customerId, productId);
      return { productId, wishlisted: false as const };
    }

    await wishlistRepository.add(customerId, productId);
    return { productId, wishlisted: true as const };
  }
}

export const wishlistService = new WishlistService();
