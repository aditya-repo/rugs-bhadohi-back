import { decimalToNumber } from "../../utils/helpers";
import { NotFoundError } from "../../utils/errors";
import { cartRepository } from "./cart.repository";
import type {
  CartLineInput,
  RemoveCartLineInput,
  ReplaceCartInput,
  UpdateCartQtyInput,
  UpsertCartLineInput,
} from "./cart.validator";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function toLineDto(item: {
  lineKey: string;
  productId: string;
  name: string;
  brand: string;
  imageSrc: string;
  imageAlt: string;
  sizeId: string;
  sizeLabel: string;
  colorId: string;
  colorLabel: string;
  unitPrice: unknown;
  unitMrp: unknown;
  quantity: number;
  serviceIds: unknown;
  serviceLabels: unknown;
  servicesPerUnit: unknown;
}): CartLineInput {
  return {
    key: item.lineKey,
    productId: item.productId,
    name: item.name,
    brand: item.brand,
    imageSrc: item.imageSrc,
    imageAlt: item.imageAlt,
    sizeId: item.sizeId,
    sizeLabel: item.sizeLabel,
    colorId: item.colorId,
    colorLabel: item.colorLabel,
    unitPrice: decimalToNumber(item.unitPrice as never),
    unitMrp: decimalToNumber(item.unitMrp as never),
    quantity: item.quantity,
    serviceIds: asStringArray(item.serviceIds),
    serviceLabels: asStringArray(item.serviceLabels),
    servicesPerUnit: decimalToNumber(item.servicesPerUnit as never),
  };
}

function cartPayload(
  cart: Awaited<ReturnType<typeof cartRepository.findCartWithItems>> | null,
) {
  if (!cart) return { items: [] as CartLineInput[] };
  return { items: cart.items.map(toLineDto) };
}

export class CartService {
  private async requireCustomerId(email: string) {
    const customer = await cartRepository.findCustomerIdByEmail(email);
    if (!customer) throw new NotFoundError("Customer not found");
    return customer.id;
  }

  async get(email: string) {
    const customer = await cartRepository.findCustomerIdByEmail(email);
    if (!customer) return { items: [] as CartLineInput[] };
    const cart = await cartRepository.findCartWithItems(customer.id);
    return cartPayload(cart);
  }

  async replace(input: ReplaceCartInput) {
    const customerId = await this.requireCustomerId(input.email);
    const cart = await cartRepository.replaceItems(customerId, input.items);
    return cartPayload(cart);
  }

  async upsertLine(input: UpsertCartLineInput) {
    const customerId = await this.requireCustomerId(input.email);
    const cart = await cartRepository.upsertLine(customerId, input.item);
    return cartPayload(cart);
  }

  async updateQuantity(input: UpdateCartQtyInput) {
    const customerId = await this.requireCustomerId(input.email);
    const cart = await cartRepository.updateQuantity(
      customerId,
      input.key,
      input.quantity,
    );
    return cartPayload(cart);
  }

  async removeLine(input: RemoveCartLineInput) {
    const customerId = await this.requireCustomerId(input.email);
    const cart = await cartRepository.removeLine(customerId, input.key);
    return cartPayload(cart);
  }

  async clear(email: string) {
    const customerId = await this.requireCustomerId(email);
    const cart = await cartRepository.clear(customerId);
    return cartPayload(cart);
  }
}

export const cartService = new CartService();
