import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import { addressService } from "./address.service";
import type {
  AddressIdBody,
  UpdateAddressInput,
  UpsertAddressInput,
} from "./address.validator";

export class AddressController {
  list = asyncHandler(async (req, res: Response) => {
    const email = String(req.query.email ?? "");
    const items = await addressService.list(email);
    sendSuccess(res, items, "Addresses retrieved");
  });

  create = asyncHandler(async (req, res: Response) => {
    const item = await addressService.create(req.body as UpsertAddressInput);
    sendSuccess(res, item, "Address created", 201);
  });

  update = asyncHandler(async (req, res: Response) => {
    const item = await addressService.update(req.body as UpdateAddressInput);
    sendSuccess(res, item, "Address updated");
  });

  remove = asyncHandler(async (req, res: Response) => {
    const items = await addressService.remove(req.body as AddressIdBody);
    sendSuccess(res, items, "Address deleted");
  });

  setDefault = asyncHandler(async (req, res: Response) => {
    const item = await addressService.setDefault(req.body as AddressIdBody);
    sendSuccess(res, item, "Default address updated");
  });
}

export const addressController = new AddressController();
