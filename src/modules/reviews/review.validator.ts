import { z } from "zod";

export const reviewQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "REPORTED"]).optional(),
  rating: z.string().optional(),
  verified: z.enum(["true", "false"]).optional(),
});

export const replyReviewSchema = z.object({
  reply: z.string().min(1),
});

export const rejectReviewSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required").max(1000),
});

export type RejectReviewInput = z.infer<typeof rejectReviewSchema>;
