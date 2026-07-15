import { Response } from "express";
import { getParam } from "../../utils/helpers";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../../utils/response";
import { AuthenticatedRequest } from "../../types/express";
import { returnService } from "./return.service";

export class ReturnController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await returnService.list(req.query as Record<string, string | undefined>);
    sendSuccess(res, result.items, "Return requests retrieved", 200, buildPaginationMeta(result.page, result.limit, result.total));
  });

  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const request = await returnService.getById(getParam(req.params.id));
    sendSuccess(res, request);
  });

  updateStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const request = await returnService.updateStatus(getParam(req.params.id), req.body, req.admin?.id);
    sendSuccess(res, request, "Return request updated");
  });

  approve = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const request = await returnService.approve(getParam(req.params.id), req.admin?.id);
    sendSuccess(res, request, "Return request approved");
  });

  reject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const request = await returnService.reject(getParam(req.params.id), req.admin?.id, req.body.note);
    sendSuccess(res, request, "Return request rejected");
  });
}

export const returnController = new ReturnController();
