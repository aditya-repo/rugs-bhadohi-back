import { ReviewStatus } from "@prisma/client";
import { NotFoundError } from "../../utils/errors";
import { parsePagination } from "../../utils/helpers";
import { activityService } from "../../services/activity.service";
import { reviewRepository } from "./review.repository";

export class ReviewService {
  async list(query: Record<string, string | undefined>) {
    const { page, limit, skip } = parsePagination(query);
    const verified = query.verified === "true" ? true : query.verified === "false" ? false : undefined;
    const { items, total } = await reviewRepository.findMany({
      skip,
      limit,
      search: query.search,
      status: query.status as ReviewStatus | undefined,
      rating: query.rating ? parseInt(query.rating, 10) : undefined,
      verified,
    });
    return { items, page, limit, total };
  }

  async getById(id: string) {
    const review = await reviewRepository.findById(id);
    if (!review) throw new NotFoundError("Review not found");
    return review;
  }

  async approve(id: string, adminId?: string) {
    await this.getById(id);
    const review = await reviewRepository.approve(id);
    await activityService.log({ adminId, action: "APPROVE", entity: "review", entityId: id });
    return review;
  }

  async reject(id: string, reason: string, adminId?: string) {
    await this.getById(id);
    const review = await reviewRepository.reject(id, reason);
    await activityService.log({ adminId, action: "REJECT", entity: "review", entityId: id });
    return review;
  }

  async reply(id: string, reply: string, adminId?: string) {
    await this.getById(id);
    const review = await reviewRepository.addReply(id, reply);
    await activityService.log({ adminId, action: "REPLY", entity: "review", entityId: id });
    return review;
  }

  async delete(id: string, adminId?: string) {
    await this.getById(id);
    await reviewRepository.delete(id);
    await activityService.log({ adminId, action: "DELETE", entity: "review", entityId: id });
    return { message: "Review deleted" };
  }
}

export const reviewService = new ReviewService();
