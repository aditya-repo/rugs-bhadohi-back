import { Router } from "express";
import { z } from "zod";
import { requireCustomerSyncSecret } from "../../middlewares/customer-sync.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { wishlistController } from "./wishlist.controller";
import {
  wishlistEmailQuerySchema,
  wishlistProductBodySchema,
} from "./wishlist.validator";

const productIdParamSchema = z.object({
  productId: z.string().min(1),
});

const router = Router();

router.get(
  "/public/ids",
  requireCustomerSyncSecret,
  validateQuery(wishlistEmailQuerySchema),
  wishlistController.listIds,
);

router.get(
  "/public",
  requireCustomerSyncSecret,
  validateQuery(wishlistEmailQuerySchema),
  wishlistController.list,
);

router.post(
  "/public",
  requireCustomerSyncSecret,
  validateBody(wishlistProductBodySchema),
  wishlistController.add,
);

router.post(
  "/public/toggle",
  requireCustomerSyncSecret,
  validateBody(wishlistProductBodySchema),
  wishlistController.toggle,
);

router.delete(
  "/public",
  requireCustomerSyncSecret,
  validateBody(wishlistProductBodySchema),
  wishlistController.remove,
);

router.delete(
  "/public/:productId",
  requireCustomerSyncSecret,
  validateParams(productIdParamSchema),
  validateQuery(wishlistEmailQuerySchema),
  wishlistController.removeByParam,
);

export default router;
