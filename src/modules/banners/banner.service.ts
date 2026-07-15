import { BannerStatus } from "@prisma/client";
import { NotFoundError, ValidationError } from "../../utils/errors";
import { parsePagination } from "../../utils/helpers";
import { activityService } from "../../services/activity.service";
import { mediaService } from "../../services/media.service";
import { bannerRepository } from "./banner.repository";
import type { CreateBannerInput, UpdateBannerInput } from "./banner.validator";

const MAX_HOMEPAGE_BANNERS = 3;

export class BannerService {
  async listPublicHomepage() {
    return bannerRepository.findActiveHomepage(MAX_HOMEPAGE_BANNERS);
  }

  async list(query: Record<string, string | undefined>) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await bannerRepository.findMany({
      skip,
      limit,
      type: query.type as CreateBannerInput["type"] | undefined,
      status: query.status as BannerStatus | undefined,
    });
    return { items, page, limit, total };
  }

  async getById(id: string) {
    const banner = await bannerRepository.findById(id);
    if (!banner) throw new NotFoundError("Banner not found");
    return banner;
  }

  async create(input: CreateBannerInput, adminId?: string) {
    if (input.type === "HOMEPAGE") {
      const count = await bannerRepository.countHomepage();
      if (count >= MAX_HOMEPAGE_BANNERS) {
        throw new ValidationError(`Homepage supports at most ${MAX_HOMEPAGE_BANNERS} banners`);
      }
    }

    const banner = await bannerRepository.create({
      title: input.title,
      type: input.type,
      image: input.image,
      mobileImage: input.mobileImage,
      linkUrl: input.linkUrl,
      buttonText: input.buttonText,
      buttonUrl: input.buttonUrl,
      sortOrder: input.sortOrder ?? 0,
      status: input.status ?? "ENABLED",
      startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
      endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
    });
    await activityService.log({ adminId, action: "CREATE", entity: "banner", entityId: banner.id });
    return banner;
  }

  async update(id: string, input: UpdateBannerInput, adminId?: string) {
    await this.getById(id);
    const banner = await bannerRepository.update(id, {
      ...input,
      startsAt: input.startsAt !== undefined ? (input.startsAt ? new Date(input.startsAt) : null) : undefined,
      endsAt: input.endsAt !== undefined ? (input.endsAt ? new Date(input.endsAt) : null) : undefined,
    });
    await activityService.log({ adminId, action: "UPDATE", entity: "banner", entityId: id });
    return banner;
  }

  async delete(id: string, adminId?: string) {
    const banner = await this.getById(id);
    await mediaService.deleteImage(banner.image);
    if (banner.mobileImage) await mediaService.deleteImage(banner.mobileImage);
    await bannerRepository.delete(id);
    await activityService.log({ adminId, action: "DELETE", entity: "banner", entityId: id });
    return { message: "Banner deleted" };
  }

  async enable(id: string, adminId?: string) {
    return this.update(id, { status: "ENABLED" }, adminId);
  }

  async disable(id: string, adminId?: string) {
    return this.update(id, { status: "DISABLED" }, adminId);
  }

  async uploadImage(files: Express.Multer.File[]) {
    return mediaService.processMultiple(files, "banners");
  }
}

export const bannerService = new BannerService();
