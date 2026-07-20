import { prisma } from "../../config/database";

export class AddressRepository {
  findCustomerIdByEmail(email: string) {
    return prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
  }

  listByCustomerId(customerId: string) {
    return prisma.address.findMany({
      where: { customerId },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });
  }

  findOwned(customerId: string, id: string) {
    return prisma.address.findFirst({
      where: { id, customerId },
    });
  }

  async create(
    customerId: string,
    data: {
      label?: string | null;
      fullName: string;
      phone: string;
      line1: string;
      line2?: string | null;
      landmark?: string | null;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      countryCode?: string | null;
      isDefault: boolean;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { customerId },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          customerId,
          label: data.label ?? null,
          fullName: data.fullName,
          phone: data.phone,
          line1: data.line1,
          line2: data.line2 ?? null,
          landmark: data.landmark ?? null,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          countryCode: data.countryCode ?? null,
          isDefault: data.isDefault,
        },
      });
    });
  }

  async update(
    customerId: string,
    id: string,
    data: {
      label?: string | null;
      fullName: string;
      phone: string;
      line1: string;
      line2?: string | null;
      landmark?: string | null;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      countryCode?: string | null;
      isDefault?: boolean;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { customerId, NOT: { id } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          label: data.label ?? null,
          fullName: data.fullName,
          phone: data.phone,
          line1: data.line1,
          line2: data.line2 ?? null,
          landmark: data.landmark ?? null,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          countryCode: data.countryCode ?? null,
          ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        },
      });
    });
  }

  async remove(customerId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });
      const remaining = await tx.address.findMany({
        where: { customerId },
        orderBy: { updatedAt: "desc" },
      });
      if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
        await tx.address.update({
          where: { id: remaining[0].id },
          data: { isDefault: true },
        });
      }
      return remaining;
    });
  }

  async setDefault(customerId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
      return tx.address.update({
        where: { id },
        data: { isDefault: true },
      });
    });
  }
}

export const addressRepository = new AddressRepository();
