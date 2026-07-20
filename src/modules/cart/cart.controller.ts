import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import { cartService } from "./cart.service";
import type {
  RemoveCartLineInput,
  ReplaceCartInput,
  UpdateCartQtyInput,
  UpsertCartLineInput,
} from "./cart.validator";

export class CartController {
  get = asyncHandler(async (req, res: Response) => {
    const email = String(req.query.email ?? "");
    const data = await cartService.get(email);
    sendSuccess(res, data, "Cart retrieved");
  });

  replace = asyncHandler(async (req, res: Response) => {
    const data = await cartService.replace(req.body as ReplaceCartInput);
    sendSuccess(res, data, "Cart saved");
  });

  upsertLine = asyncHandler(async (req, res: Response) => {
    const data = await cartService.upsertLine(req.body as UpsertCartLineInput);
    sendSuccess(res, data, "Cart item saved");
  });

  updateQuantity = asyncHandler(async (req, res: Response) => {
    const data = await cartService.updateQuantity(req.body as UpdateCartQtyInput);
    sendSuccess(res, data, "Cart quantity updated");
  });

  removeLine = asyncHandler(async (req, res: Response) => {
    const data = await cartService.removeLine(req.body as RemoveCartLineInput);
    sendSuccess(res, data, "Cart item removed");
  });

  clear = asyncHandler(async (req, res: Response) => {
    const email = String((req.body as { email?: string }).email ?? "");
    const data = await cartService.clear(email);
    sendSuccess(res, data, "Cart cleared");
  });
}

export const cartController = new CartController();
