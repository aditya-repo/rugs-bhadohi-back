import { Response } from "express";
import { getParam } from "../../utils/helpers";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import { AuthenticatedRequest } from "../../types/express";
import { seoService } from "./seo.service";
import type { UpdateProductSeoInput } from "./seo.validator";

export class SeoController {
  getProductSeo = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await seoService.getProductSeo(getParam(req.params.productId));
    sendSuccess(res, data);
  });

  updateProductSeo = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const seo = await seoService.updateProductSeo(getParam(req.params.productId), req.body as UpdateProductSeoInput);
    sendSuccess(res, seo, "SEO updated");
  });

  generateSlug = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await seoService.generateSlug(req.body.title, req.query.excludeId as string | undefined);
    sendSuccess(res, result);
  });

  previewSlug = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await seoService.previewSlug(req.body.title);
    sendSuccess(res, result);
  });
}

export const seoController = new SeoController();
