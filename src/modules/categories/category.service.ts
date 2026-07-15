import { NotFoundError, ConflictError } from "../../utils/errors";
import { generateUniqueSlug, parsePagination } from "../../utils/helpers";
import { toJsonValue } from "../../utils/prisma";
import { activityService } from "../../services/activity.service";
import { categoryRepository } from "./category.repository";
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.validator";

export class CategoryService {
  async list(query: Record<string, string | undefined>) {
    const { page, limit, skip } = parsePagination(query);
    const featured = query.featured === "true" ? true : query.featured === "false" ? false : undefined;
    const { items, total } = await categoryRepository.findMany({
      skip,
      limit,
      search: query.search,
      status: query.status as "ACTIVE" | "DRAFT" | "INACTIVE" | undefined,
      parentId: query.parentId,
      featured,
    });
    return { items, page, limit, total };
  }

  async getTree() {
    return categoryRepository.getTree();
  }

  async listPublicHomepage() {
    return categoryRepository.findHomepage();
  }

  async listPublicActive() {
    return categoryRepository.findPublicActive();
  }

  async getById(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new NotFoundError("Category not found");
    return category;
  }

  async create(input: CreateCategoryInput, adminId?: string) {
    const slug = input.slug
      ? input.slug
      : await generateUniqueSlug(input.name, async (s) => !!(await categoryRepository.findBySlug(s)));

    const existing = await categoryRepository.findBySlug(slug);
    if (existing) throw new ConflictError("Category slug already exists");

    const category = await categoryRepository.create({
      name: input.name,
      slug,
      description: input.description,
      image: input.image,
      banner: input.banner,
      parent: input.parentId ? { connect: { id: input.parentId } } : undefined,
      sortOrder: input.sortOrder ?? 0,
      status: input.status ?? "ACTIVE",
      isFeatured: input.isFeatured ?? false,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      seoKeywords: input.seoKeywords,
      ogImage: input.ogImage,
      canonicalUrl: input.canonicalUrl,
      schemaJson: toJsonValue(input.schemaJson),
    });

    await activityService.log({
      adminId,
      action: "CREATE",
      entity: "category",
      entityId: category.id,
    });

    return category;
  }

  async update(id: string, input: UpdateCategoryInput, adminId?: string) {
    await this.getById(id);

    let slug = input.slug;
    if (input.name && !input.slug) {
      slug = await generateUniqueSlug(input.name, async (s) => {
        const found = await categoryRepository.findBySlug(s);
        return found !== null && found.id !== id;
      });
    }

    const category = await categoryRepository.update(id, {
      name: input.name,
      slug,
      description: input.description,
      image: input.image,
      banner: input.banner,
      sortOrder: input.sortOrder,
      status: input.status,
      isFeatured: input.isFeatured,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      seoKeywords: input.seoKeywords,
      ogImage: input.ogImage,
      canonicalUrl: input.canonicalUrl,
      parent:
        input.parentId !== undefined
          ? input.parentId
            ? { connect: { id: input.parentId } }
            : { disconnect: true }
          : undefined,
      schemaJson: input.schemaJson !== undefined ? toJsonValue(input.schemaJson) : undefined,
    });

    await activityService.log({ adminId, action: "UPDATE", entity: "category", entityId: id });
    return category;
  }

  async delete(id: string, adminId?: string) {
    await this.getById(id);
    await categoryRepository.softDelete(id);
    await activityService.log({ adminId, action: "DELETE", entity: "category", entityId: id });
    return { message: "Category deleted" };
  }
}

export const categoryService = new CategoryService();
