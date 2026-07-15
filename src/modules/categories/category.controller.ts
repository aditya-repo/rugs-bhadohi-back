import { Response } from "express";
import { getParam } from "../../utils/helpers";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, sendCreated, buildPaginationMeta } from "../../utils/response";
import { AuthenticatedRequest } from "../../types/express";
import { categoryService } from "./category.service";
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.validator";

export class CategoryController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await categoryService.list(req.query as Record<string, string | undefined>);
    sendSuccess(res, result.items, "Categories retrieved", 200, buildPaginationMeta(result.page, result.limit, result.total));
  });

  tree = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const tree = await categoryService.getTree();
    sendSuccess(res, tree);
  });

  listPublicHomepage = asyncHandler(async (_req, res: Response) => {
    const categories = await categoryService.listPublicHomepage();
    sendSuccess(res, categories, "Homepage categories retrieved");
  });

  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const category = await categoryService.getById(getParam(req.params.id));
    sendSuccess(res, category);
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const category = await categoryService.create(req.body as CreateCategoryInput, req.admin?.id);
    sendCreated(res, category, "Category created");
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const category = await categoryService.update(getParam(req.params.id), req.body as UpdateCategoryInput, req.admin?.id);
    sendSuccess(res, category, "Category updated");
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await categoryService.delete(getParam(req.params.id), req.admin?.id);
    sendSuccess(res, result);
  });
}

export const categoryController = new CategoryController();
