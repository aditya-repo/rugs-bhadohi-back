import { NotFoundError, ConflictError } from "../../utils/errors";
import { parsePagination } from "../../utils/helpers";
import { activityService } from "../../services/activity.service";
import { DEFAULT_COLORS } from "./default-colors";
import { colorRepository } from "./color.repository";
import type { CreateColorInput, UpdateColorInput } from "./color.validator";

function normalizeHex(hex: string) {
  const value = hex.trim().toUpperCase();
  if (/^#[0-9A-F]{3}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return value;
}

export class ColorService {
  async ensureDefaults() {
    const count = await colorRepository.countActive();
    if (count > 0) return;
    await colorRepository.upsertDefaults(DEFAULT_COLORS);
  }

  async seedDefaults() {
    await colorRepository.upsertDefaults(DEFAULT_COLORS);
  }

  async list(query: Record<string, string | undefined>) {
    await this.ensureDefaults();
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await colorRepository.findMany({
      skip,
      limit,
      search: query.search,
      status: query.status as "ACTIVE" | "DRAFT" | "INACTIVE" | undefined,
    });
    return { items, page, limit, total };
  }

  async listActive() {
    await this.ensureDefaults();
    return colorRepository.findActive();
  }

  async getById(id: string) {
    const color = await colorRepository.findById(id);
    if (!color) throw new NotFoundError("Color not found");
    return color;
  }

  async create(input: CreateColorInput, adminId?: string) {
    const name = input.name.trim();
    const existing = await colorRepository.findByName(name);
    if (existing) throw new ConflictError("Color name already exists");

    const color = await colorRepository.create({
      name,
      hex: normalizeHex(input.hex),
      sortOrder: input.sortOrder ?? 0,
      status: input.status ?? "ACTIVE",
    });

    await activityService.log({
      adminId,
      action: "CREATE",
      entity: "color",
      entityId: color.id,
    });

    return color;
  }

  async update(id: string, input: UpdateColorInput, adminId?: string) {
    await this.getById(id);

    if (input.name) {
      const existing = await colorRepository.findByName(input.name.trim());
      if (existing && existing.id !== id) {
        throw new ConflictError("Color name already exists");
      }
    }

    const color = await colorRepository.update(id, {
      name: input.name?.trim(),
      hex: input.hex ? normalizeHex(input.hex) : undefined,
      sortOrder: input.sortOrder,
      status: input.status,
    });

    await activityService.log({
      adminId,
      action: "UPDATE",
      entity: "color",
      entityId: id,
    });

    return color;
  }

  async delete(id: string, adminId?: string) {
    await this.getById(id);
    await colorRepository.softDelete(id);
    await activityService.log({
      adminId,
      action: "DELETE",
      entity: "color",
      entityId: id,
    });
    return { message: "Color deleted" };
  }
}

export const colorService = new ColorService();
