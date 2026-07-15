import { CustomerStatus } from "@prisma/client";
import { NotFoundError } from "../../utils/errors";
import { parsePagination } from "../../utils/helpers";
import { customerRepository } from "./customer.repository";

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
}

export const customerService = new CustomerService();
