import { Response } from "express";
import { getParam } from "../../utils/helpers";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, sendCreated, buildPaginationMeta } from "../../utils/response";
import { AuthenticatedRequest } from "../../types/express";
import { productService } from "./product.service";
import type { CreateProductInput, UpdateProductInput } from "./product.validator";

export class ProductController {
  listPublicArtistCollection = asyncHandler(async (_req, res: Response) => {
    const products = await productService.listPublicArtistCollection();
    sendSuccess(res, products, "Artist collection retrieved");
  });

  listPublicFeatured = asyncHandler(async (_req, res: Response) => {
    const products = await productService.listPublicFeatured(8);
    sendSuccess(res, products, "Featured products retrieved");
  });

  getPublicByIdOrSlug = asyncHandler(async (req, res: Response) => {
    const product = await productService.getPublicByIdOrSlug(getParam(req.params.idOrSlug));
    sendSuccess(res, product, "Product retrieved");
  });

  listPublicCatalog = asyncHandler(async (req, res: Response) => {
    const result = await productService.listPublicCatalog(
      req.query as Record<string, string | undefined>,
    );
    sendSuccess(
      res,
      result.items,
      "Products retrieved",
      200,
      buildPaginationMeta(result.page, result.limit, result.total),
    );
  });

  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await productService.list(req.query as Record<string, string | undefined>);
    sendSuccess(res, result.items, "Products retrieved", 200, buildPaginationMeta(result.page, result.limit, result.total));
  });

  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const product = await productService.getById(getParam(req.params.id));
    sendSuccess(res, product);
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const product = await productService.create(req.body as CreateProductInput, req.admin?.id);
    sendCreated(res, product);
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const product = await productService.update(getParam(req.params.id), req.body as UpdateProductInput, req.admin?.id);
    sendSuccess(res, product, "Product updated");
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await productService.delete(getParam(req.params.id), req.admin?.id);
    sendSuccess(res, result);
  });

  duplicate = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const product = await productService.duplicate(getParam(req.params.id), req.admin?.id);
    sendCreated(res, product, "Product duplicated");
  });

  publish = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const product = await productService.publish(getParam(req.params.id), req.admin?.id);
    sendSuccess(res, product, "Product published");
  });

  draft = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const product = await productService.draft(getParam(req.params.id), req.admin?.id);
    sendSuccess(res, product, "Product moved to draft");
  });

  archive = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const product = await productService.archive(getParam(req.params.id), req.admin?.id);
    sendSuccess(res, product, "Product archived");
  });

  bulkDelete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await productService.bulkDelete(req.body.ids, req.admin?.id);
    sendSuccess(res, result);
  });

  bulkPublish = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await productService.bulkPublish(req.body.ids, req.admin?.id);
    sendSuccess(res, result);
  });

  bulkDraft = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await productService.bulkDraft(req.body.ids, req.admin?.id);
    sendSuccess(res, result);
  });

  bulkCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await productService.bulkCategoryUpdate(req.body.ids, req.body.categoryId, req.admin?.id);
    sendSuccess(res, result);
  });

  uploadImages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const images = await productService.uploadImages(getParam(req.params.id), files ?? [], req.admin?.id);
    sendCreated(res, images, "Images uploaded");
  });

  reorderImages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const product = await productService.reorderImages(getParam(req.params.id), req.body.images);
    sendSuccess(res, product, "Images reordered");
  });

  deleteImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await productService.deleteImage(getParam(req.params.id), getParam(req.params.imageId), req.admin?.id);
    sendSuccess(res, result);
  });

  exportProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const products = await productService.exportProducts(req.query as Record<string, string | undefined>);
    sendSuccess(res, products, "Products exported");
  });
}

export const productController = new ProductController();
