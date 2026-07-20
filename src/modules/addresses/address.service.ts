import { NotFoundError } from "../../utils/errors";
import { addressRepository } from "./address.repository";
import type {
  AddressIdBody,
  UpdateAddressInput,
  UpsertAddressInput,
} from "./address.validator";

function toDto(address: {
  id: string;
  label: string | null;
  fullName: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  const label =
    address.label === "work" || address.label === "other" || address.label === "home"
      ? address.label
      : "other";

  return {
    id: address.id,
    label,
    fullName: address.fullName ?? "",
    phone: address.phone ?? "",
    line1: address.line1,
    line2: address.line2 ?? "",
    landmark: address.landmark ?? "",
    city: address.city,
    state: address.state,
    pincode: address.postalCode,
    country: address.country,
    countryCode: address.countryCode ?? "",
    isDefault: address.isDefault,
    createdAt: address.createdAt.toISOString(),
    updatedAt: address.updatedAt.toISOString(),
  };
}

export class AddressService {
  private async requireCustomerId(email: string) {
    const customer = await addressRepository.findCustomerIdByEmail(email);
    if (!customer) throw new NotFoundError("Customer not found");
    return customer.id;
  }

  async list(email: string) {
    const customer = await addressRepository.findCustomerIdByEmail(email);
    if (!customer) return [];
    const rows = await addressRepository.listByCustomerId(customer.id);
    return rows.map(toDto);
  }

  async create(input: UpsertAddressInput) {
    const customerId = await this.requireCustomerId(input.email);
    const existing = await addressRepository.listByCustomerId(customerId);
    const isDefault = input.isDefault ?? existing.length === 0;

    const created = await addressRepository.create(customerId, {
      label: input.label,
      fullName: input.fullName,
      phone: input.phone,
      line1: input.line1,
      line2: input.line2,
      landmark: input.landmark,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country,
      countryCode: input.countryCode?.toUpperCase() || null,
      isDefault,
    });
    return toDto(created);
  }

  async update(input: UpdateAddressInput) {
    const customerId = await this.requireCustomerId(input.email);
    const owned = await addressRepository.findOwned(customerId, input.id);
    if (!owned) throw new NotFoundError("Address not found");

    const updated = await addressRepository.update(customerId, input.id, {
      label: input.label,
      fullName: input.fullName,
      phone: input.phone,
      line1: input.line1,
      line2: input.line2,
      landmark: input.landmark,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country,
      countryCode: input.countryCode?.toUpperCase() || null,
      isDefault: input.isDefault,
    });
    return toDto(updated);
  }

  async remove(input: AddressIdBody) {
    const customerId = await this.requireCustomerId(input.email);
    const owned = await addressRepository.findOwned(customerId, input.id);
    if (!owned) throw new NotFoundError("Address not found");

    await addressRepository.remove(customerId, input.id);
    const rows = await addressRepository.listByCustomerId(customerId);
    return rows.map(toDto);
  }

  async setDefault(input: AddressIdBody) {
    const customerId = await this.requireCustomerId(input.email);
    const owned = await addressRepository.findOwned(customerId, input.id);
    if (!owned) throw new NotFoundError("Address not found");

    const updated = await addressRepository.setDefault(customerId, input.id);
    return toDto(updated);
  }
}

export const addressService = new AddressService();
