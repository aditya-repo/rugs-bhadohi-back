import { CustomerStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

const profileSelect = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  image: true,
  gender: true,
  dateOfBirth: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomerSelect;

export class CustomerRepository {
  async findMany(params: {
    skip: number;
    limit: number;
    search?: string;
    status?: CustomerStatus;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const where: Prisma.CustomerWhereInput = {};
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: "insensitive" } },
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { phone: { contains: params.search, mode: "insensitive" } },
      ];
    }
    if (params.status) where.status = params.status;

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {};
    orderBy[(params.sortBy ?? "createdAt") as keyof Prisma.CustomerOrderByWithRelationInput] =
      params.sortOrder ?? "desc";

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy,
        include: { _count: { select: { orders: true, reviews: true } } },
      }),
      prisma.customer.count({ where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { _count: { select: { items: true } } },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          include: { product: { select: { id: true, title: true } } },
        },
        wishlistItems: {
          include: {
            product: {
              select: { id: true, title: true, slug: true, images: { take: 1 } },
            },
          },
        },
        returnRequests: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  findByEmail(email: string) {
    return prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
      select: profileSelect,
    });
  }

  async upsertFromGoogle(input: {
    email: string;
    firstName: string;
    lastName: string;
    image?: string | null;
  }) {
    const email = input.email.toLowerCase();
    return prisma.customer.upsert({
      where: { email },
      create: {
        email,
        firstName: input.firstName,
        lastName: input.lastName || "",
        image: input.image || null,
        lastLoginAt: new Date(),
      },
      update: {
        // Keep name/phone/gender/DOB from profile edits; only refresh login + photo.
        ...(input.image ? { image: input.image } : {}),
        lastLoginAt: new Date(),
      },
      select: profileSelect,
    });
  }

  updateProfile(
    email: string,
    data: {
      firstName: string;
      lastName: string;
      phone?: string | null;
      gender?: string | null;
      dateOfBirth?: Date | null;
      image?: string | null;
    },
  ) {
    return prisma.customer.update({
      where: { email: email.toLowerCase() },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        ...(data.image !== undefined ? { image: data.image } : {}),
      },
      select: profileSelect,
    });
  }

  updateStatus(id: string, status: CustomerStatus) {
    return prisma.customer.update({ where: { id }, data: { status } });
  }
}

export const customerRepository = new CustomerRepository();
