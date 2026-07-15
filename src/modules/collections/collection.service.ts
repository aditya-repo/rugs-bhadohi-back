import { prisma } from "../../config/database";
import { NotFoundError, ConflictError } from "../../utils/errors";
import { generateUniqueSlug, parsePagination } from "../../utils/helpers";
import { activityService } from "../../services/activity.service";
import { mediaService } from "../../services/media.service";
import { collectionRepository } from "./collection.repository";
import type { CreateCollectionInput, UpdateCollectionInput } from "./collection.validator";

export class CollectionService {
  async list(query: Record<string, string | undefined>) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await collectionRepository.findMany({
      skip,
      limit,
      search: query.search,
      status: query.status as "ACTIVE" | "DRAFT" | "INACTIVE" | undefined,
    });
    return { items, page, limit, total };
  }

  async listActive() {
    return collectionRepository.findActiveTitles();
  }

  async listPublicHomepage() {
    return collectionRepository.findPublicHomepage();
  }

  async getById(id: string) {
    const collection = await collectionRepository.findById(id);
    if (!collection) throw new NotFoundError("Collection not found");
    return collection;
  }

  async create(input: CreateCollectionInput, adminId?: string) {
    const slug = input.slug
      ? input.slug
      : await generateUniqueSlug(input.title, async (s) => !!(await collectionRepository.findBySlug(s)));

    const existing = await collectionRepository.findBySlug(slug);
    if (existing) throw new ConflictError("Collection slug already exists");

    const collection = await collectionRepository.create({
      title: input.title,
      slug,
      description: input.description,
      image: input.image || null,
      sortOrder: input.sortOrder ?? 0,
      status: input.status ?? "ACTIVE",
    });

    await activityService.log({
      adminId,
      action: "CREATE",
      entity: "collection",
      entityId: collection.id,
    });

    return collection;
  }

  async update(id: string, input: UpdateCollectionInput, adminId?: string) {
    const existing = await this.getById(id);

    let slug = input.slug;
    if (input.title && !input.slug) {
      slug = await generateUniqueSlug(input.title, async (s) => {
        const found = await collectionRepository.findBySlug(s);
        return found !== null && found.id !== id;
      });
    }

    // Always replace Cloudinary asset when image changes or is cleared
    if (input.image !== undefined) {
      const nextImage = input.image?.trim() || null;
      if (existing.image && existing.image !== nextImage) {
        await mediaService.deleteImage(existing.image);
      }
    }

    const nextTitle = input.title ?? existing.title;
    const collection = await collectionRepository.update(id, {
      title: input.title,
      slug,
      description: input.description,
      image:
        input.image === undefined
          ? undefined
          : input.image?.trim()
            ? input.image.trim()
            : null,
      sortOrder: input.sortOrder,
      status: input.status,
    });

    if (input.title && input.title !== existing.title) {
      const products = await prisma.product.findMany({
        where: {
          deletedAt: null,
          collection: { contains: existing.title },
        },
        select: { id: true, collection: true },
      });

      for (const product of products) {
        const titles = (product.collection ?? "")
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
          .map((title) => (title === existing.title ? nextTitle : title));

        await prisma.product.update({
          where: { id: product.id },
          data: { collection: titles.join(", ") },
        });
      }
    }

    await activityService.log({ adminId, action: "UPDATE", entity: "collection", entityId: id });
    return collection;
  }

  async delete(id: string, adminId?: string) {
    const existing = await this.getById(id);
    if (existing.image) {
      await mediaService.deleteImage(existing.image);
    }
    await collectionRepository.softDelete(id);
    await activityService.log({ adminId, action: "DELETE", entity: "collection", entityId: id });
    return { message: "Collection deleted" };
  }
}

export const collectionService = new CollectionService();
