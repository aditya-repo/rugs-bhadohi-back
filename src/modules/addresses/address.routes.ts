import { Router } from "express";
import { requireCustomerSyncSecret } from "../../middlewares/customer-sync.middleware";
import { validateBody, validateQuery } from "../../middlewares/validate.middleware";
import { addressController } from "./address.controller";
import {
  addressEmailQuerySchema,
  addressIdBodySchema,
  updateAddressSchema,
  upsertAddressSchema,
} from "./address.validator";

const router = Router();

router.get(
  "/public",
  requireCustomerSyncSecret,
  validateQuery(addressEmailQuerySchema),
  addressController.list,
);

router.post(
  "/public",
  requireCustomerSyncSecret,
  validateBody(upsertAddressSchema),
  addressController.create,
);

router.put(
  "/public",
  requireCustomerSyncSecret,
  validateBody(updateAddressSchema),
  addressController.update,
);

router.delete(
  "/public",
  requireCustomerSyncSecret,
  validateBody(addressIdBodySchema),
  addressController.remove,
);

router.post(
  "/public/default",
  requireCustomerSyncSecret,
  validateBody(addressIdBodySchema),
  addressController.setDefault,
);

export default router;
