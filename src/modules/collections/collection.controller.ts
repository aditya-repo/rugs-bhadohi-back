import { Response } from "express";
import { getParam } from "../../utils/helpers";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, sendCreated, buildPaginationMeta } from "../../utils/response";
import { AuthenticatedRequest } from "../../types/express";
import { collectionService } from "./collection.service";
import type { CreateCollectionInput, UpdateCollectionInput } from "./collection.validator";

export class CollectionController {
  listPublicHomepage = asyncHandler(async (_req, res: Response) => {
    const collections = await collectionService.listPublicHomepage();
    sendSuccess(res, collections, "Homepage collections retrieved");
  });

  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await collectionService.list(req.query as Record<string, string | undefined>);
    sendSuccess(
      res,
      result.items,
      "Collections retrieved",
      200,
      buildPaginationMeta(result.page, result.limit, result.total),
    );
  });

  listActive = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const items = await collectionService.listActive();
    sendSuccess(res, items, "Active collections retrieved");
  });

  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const collection = await collectionService.getById(getParam(req.params.id));
    sendSuccess(res, collection);
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const collection = await collectionService.create(
      req.body as CreateCollectionInput,
      req.admin?.id,
    );
    sendCreated(res, collection, "Collection created");
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const collection = await collectionService.update(
      getParam(req.params.id),
      req.body as UpdateCollectionInput,
      req.admin?.id,
    );
    sendSuccess(res, collection, "Collection updated");
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await collectionService.delete(getParam(req.params.id), req.admin?.id);
    sendSuccess(res, result);
  });
}

export const collectionController = new CollectionController();
