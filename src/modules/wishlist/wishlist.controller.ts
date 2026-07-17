import { Response } from "express";
import { getParam } from "../../utils/helpers";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import { wishlistService } from "./wishlist.service";
import type { WishlistProductBody } from "./wishlist.validator";

export class WishlistController {
  listIds = asyncHandler(async (req, res: Response) => {
    const email = String(req.query.email ?? "");
    const data = await wishlistService.listIds(email);
    sendSuccess(res, data, "Wishlist ids retrieved");
  });

  list = asyncHandler(async (req, res: Response) => {
    const email = String(req.query.email ?? "");
    const items = await wishlistService.list(email);
    sendSuccess(res, items, "Wishlist retrieved");
  });

  add = asyncHandler(async (req, res: Response) => {
    const body = req.body as WishlistProductBody;
    const data = await wishlistService.add(body.email, body.productId);
    sendSuccess(res, data, "Added to wishlist", 201);
  });

  remove = asyncHandler(async (req, res: Response) => {
    const body = req.body as WishlistProductBody;
    const data = await wishlistService.remove(body.email, body.productId);
    sendSuccess(res, data, "Removed from wishlist");
  });

  toggle = asyncHandler(async (req, res: Response) => {
    const body = req.body as WishlistProductBody;
    const data = await wishlistService.toggle(body.email, body.productId);
    sendSuccess(
      res,
      data,
      data.wishlisted ? "Added to wishlist" : "Removed from wishlist",
    );
  });

  removeByParam = asyncHandler(async (req, res: Response) => {
    const email = String(req.query.email ?? "");
    const productId = getParam(req.params.productId);
    const data = await wishlistService.remove(email, productId);
    sendSuccess(res, data, "Removed from wishlist");
  });
}

export const wishlistController = new WishlistController();
