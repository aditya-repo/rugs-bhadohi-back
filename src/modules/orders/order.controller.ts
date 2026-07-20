import { Response } from "express";
import { getParam } from "../../utils/helpers";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../../utils/response";
import { AuthenticatedRequest } from "../../types/express";
import { orderService } from "./order.service";
import type { UpdateOrderStatusInput } from "./order.validator";

export class OrderController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await orderService.list(req.query as Record<string, string | undefined>);
    sendSuccess(res, result.items, "Orders retrieved", 200, buildPaginationMeta(result.page, result.limit, result.total));
  });

  listRecentForCustomer = asyncHandler(async (req, res: Response) => {
    const email = String(req.query.email ?? "");
    const limit = req.query.limit != null ? String(req.query.limit) : undefined;
    const items = await orderService.listRecentForCustomer(email, limit);
    sendSuccess(res, items, "Recent orders retrieved");
  });

  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const order = await orderService.getById(getParam(req.params.id));
    sendSuccess(res, order);
  });

  updateStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const order = await orderService.updateStatus(getParam(req.params.id), req.body as UpdateOrderStatusInput, req.admin?.id);
    sendSuccess(res, order, "Order status updated");
  });

  addNote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const note = await orderService.addNote(getParam(req.params.id), req.body.note, req.admin?.id, req.body.isInternal);
    sendSuccess(res, note, "Note added");
  });

  generateInvoice = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const invoice = await orderService.generateInvoice(getParam(req.params.id), req.admin?.id);
    sendSuccess(res, invoice, "Invoice generated");
  });
}

export const orderController = new OrderController();
