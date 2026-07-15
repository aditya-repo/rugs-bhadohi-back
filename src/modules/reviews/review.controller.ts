import { Response } from "express";
import { getParam } from "../../utils/helpers";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../../utils/response";
import { AuthenticatedRequest } from "../../types/express";
import { reviewService } from "./review.service";
import type { RejectReviewInput } from "./review.validator";

export class ReviewController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await reviewService.list(req.query as Record<string, string | undefined>);
    sendSuccess(res, result.items, "Reviews retrieved", 200, buildPaginationMeta(result.page, result.limit, result.total));
  });

  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const review = await reviewService.getById(getParam(req.params.id));
    sendSuccess(res, review);
  });

  approve = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const review = await reviewService.approve(getParam(req.params.id), req.admin?.id);
    sendSuccess(res, review, "Review approved");
  });

  reject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { reason } = req.body as RejectReviewInput;
    const review = await reviewService.reject(getParam(req.params.id), reason, req.admin?.id);
    sendSuccess(res, review, "Review rejected");
  });

  reply = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const review = await reviewService.reply(getParam(req.params.id), req.body.reply, req.admin?.id);
    sendSuccess(res, review, "Reply added");
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await reviewService.delete(getParam(req.params.id), req.admin?.id);
    sendSuccess(res, result);
  });
}

export const reviewController = new ReviewController();
