import { Router } from "express";
import { z } from "zod";
import { requireCustomerSyncSecret } from "../../middlewares/customer-sync.middleware";
import { validateBody, validateQuery } from "../../middlewares/validate.middleware";
import { cartController } from "./cart.controller";
import {
  cartEmailQuerySchema,
  removeCartLineSchema,
  replaceCartSchema,
  updateCartQtySchema,
  upsertCartLineSchema,
} from "./cart.validator";

const clearCartSchema = z.object({
  email: z.string().email(),
});

const router = Router();

router.get(
  "/public",
  requireCustomerSyncSecret,
  validateQuery(cartEmailQuerySchema),
  cartController.get,
);

router.put(
  "/public",
  requireCustomerSyncSecret,
  validateBody(replaceCartSchema),
  cartController.replace,
);

router.post(
  "/public/items",
  requireCustomerSyncSecret,
  validateBody(upsertCartLineSchema),
  cartController.upsertLine,
);

router.patch(
  "/public/items",
  requireCustomerSyncSecret,
  validateBody(updateCartQtySchema),
  cartController.updateQuantity,
);

router.delete(
  "/public/items",
  requireCustomerSyncSecret,
  validateBody(removeCartLineSchema),
  cartController.removeLine,
);

router.delete(
  "/public",
  requireCustomerSyncSecret,
  validateBody(clearCartSchema),
  cartController.clear,
);

export default router;
