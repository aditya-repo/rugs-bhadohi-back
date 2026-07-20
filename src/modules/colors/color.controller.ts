import { Response } from "express";
import { getParam } from "../../utils/helpers";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, sendCreated, buildPaginationMeta } from "../../utils/response";
import { AuthenticatedRequest } from "../../types/express";
import { colorService } from "./color.service";
import type { CreateColorInput, UpdateColorInput } from "./color.validator";

export class ColorController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await colorService.list(req.query as Record<string, string | undefined>);
    sendSuccess(
      res,
      result.items,
      "Colors retrieved",
      200,
      buildPaginationMeta(result.page, result.limit, result.total),
    );
  });

  listActive = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const items = await colorService.listActive();
    sendSuccess(res, items, "Active colors retrieved");
  });

  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const color = await colorService.getById(getParam(req.params.id));
    sendSuccess(res, color);
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const color = await colorService.create(req.body as CreateColorInput, req.admin?.id);
    sendCreated(res, color, "Color created");
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const color = await colorService.update(
      getParam(req.params.id),
      req.body as UpdateColorInput,
      req.admin?.id,
    );
    sendSuccess(res, color, "Color updated");
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await colorService.delete(getParam(req.params.id), req.admin?.id);
    sendSuccess(res, result);
  });
}

export const colorController = new ColorController();
