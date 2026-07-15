import { Response } from "express";
import { getParam } from "../../utils/helpers";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../../utils/response";
import { AuthenticatedRequest } from "../../types/express";
import { customerService } from "./customer.service";

export class CustomerController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await customerService.list(req.query as Record<string, string | undefined>);
    sendSuccess(res, result.items, "Customers retrieved", 200, buildPaginationMeta(result.page, result.limit, result.total));
  });

  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const customer = await customerService.getById(getParam(req.params.id));
    sendSuccess(res, customer);
  });

  updateStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const customer = await customerService.updateStatus(getParam(req.params.id), req.body.status);
    sendSuccess(res, customer, "Customer status updated");
  });
}

export const customerController = new CustomerController();
