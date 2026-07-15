import { z } from "zod";

export const returnQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "PROCESSING", "PICKED_UP", "REFUNDED", "EXCHANGED", "COMPLETED", "CANCELLED"]).optional(),
  type: z.enum(["RETURN", "EXCHANGE"]).optional(),
});

export const updateReturnStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "PROCESSING", "PICKED_UP", "REFUNDED", "EXCHANGED", "COMPLETED", "CANCELLED"]),
  note: z.string().optional(),
  adminNotes: z.string().optional(),
  pickupStatus: z.enum(["NOT_SCHEDULED", "SCHEDULED", "PICKED_UP", "FAILED"]).optional(),
  refundStatus: z.enum(["NOT_INITIATED", "PENDING", "PROCESSED", "FAILED"]).optional(),
});
