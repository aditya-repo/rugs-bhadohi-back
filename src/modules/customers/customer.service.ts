import { CustomerStatus } from "@prisma/client";
import { NotFoundError } from "../../utils/errors";
import { parsePagination } from "../../utils/helpers";
import { customerRepository } from "./customer.repository";
import type {
  SyncCustomerInput,
  UpdateCustomerProfileInput,
} from "./customer.validator";

function toProfileDto(customer: {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  image: string | null;
  gender: string | null;
  dateOfBirth: Date | null;
  status: CustomerStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim();
  return {
    id: customer.id,
    email: customer.email,
    name,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone ?? "",
    image: customer.image,
    gender: customer.gender ?? "unspecified",
    dateOfBirth: customer.dateOfBirth
      ? customer.dateOfBirth.toISOString().slice(0, 10)
      : "",
    status: customer.status,
    lastLoginAt: customer.lastLoginAt,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

export class CustomerService {
  async list(query: Record<string, string | undefined>) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await customerRepository.findMany({
      skip,
      limit,
      search: query.search,
      status: query.status as CustomerStatus | undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder as "asc" | "desc" | undefined,
    });
    return { items, page, limit, total };
  }

  async getById(id: string) {
    const customer = await customerRepository.findById(id);
    if (!customer) throw new NotFoundError("Customer not found");
    return customer;
  }

  async updateStatus(id: string, status: CustomerStatus) {
    await this.getById(id);
    return customerRepository.updateStatus(id, status);
  }

  async syncFromGoogle(input: SyncCustomerInput) {
    const customer = await customerRepository.upsertFromGoogle({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName ?? "",
      image: input.image,
    });
    return toProfileDto(customer);
  }

  async getProfileByEmail(email: string) {
    const customer = await customerRepository.findByEmail(email);
    if (!customer) throw new NotFoundError("Customer not found");
    return toProfileDto(customer);
  }

  async updateProfile(input: UpdateCustomerProfileInput) {
    const existing = await customerRepository.findByEmail(input.email);
    if (!existing) throw new NotFoundError("Customer not found");

    const dobRaw = input.dateOfBirth?.trim() || null;
    const customer = await customerRepository.updateProfile(input.email, {
      firstName: input.firstName,
      lastName: input.lastName ?? "",
      phone: input.phone?.trim() || null,
      gender: input.gender?.trim() || null,
      dateOfBirth: dobRaw ? new Date(`${dobRaw}T12:00:00.000Z`) : null,
      image: input.image,
    });
    return toProfileDto(customer);
  }
}

export const customerService = new CustomerService();
