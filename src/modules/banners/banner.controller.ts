import { Response } from "express";
import { getParam } from "../../utils/helpers";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, sendCreated, buildPaginationMeta } from "../../utils/response";
import { AuthenticatedRequest } from "../../types/express";
import { bannerService } from "./banner.service";
import type { CreateBannerInput, UpdateBannerInput } from "./banner.validator";

export class BannerController {
  listPublicHomepage = asyncHandler(async (_req, res: Response) => {
    const banners = await bannerService.listPublicHomepage();
    sendSuccess(res, banners, "Homepage banners retrieved");
  });

  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await bannerService.list(req.query as Record<string, string | undefined>);
    sendSuccess(res, result.items, "Banners retrieved", 200, buildPaginationMeta(result.page, result.limit, result.total));
  });

  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const banner = await bannerService.getById(getParam(req.params.id));
    sendSuccess(res, banner);
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const banner = await bannerService.create(req.body as CreateBannerInput, req.admin?.id);
    sendCreated(res, banner);
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const banner = await bannerService.update(getParam(req.params.id), req.body as UpdateBannerInput, req.admin?.id);
    sendSuccess(res, banner, "Banner updated");
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await bannerService.delete(getParam(req.params.id), req.admin?.id);
    sendSuccess(res, result);
  });

  enable = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const banner = await bannerService.enable(getParam(req.params.id), req.admin?.id);
    sendSuccess(res, banner, "Banner enabled");
  });

  disable = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const banner = await bannerService.disable(getParam(req.params.id), req.admin?.id);
    sendSuccess(res, banner, "Banner disabled");
  });

  upload = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const images = await bannerService.uploadImage(files ?? []);
    sendCreated(res, images, "Banner images uploaded");
  });
}

export const bannerController = new BannerController();
