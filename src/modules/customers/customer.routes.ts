import { Router } from "express";
import { customerController } from "./customer.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireCustomerSyncSecret } from "../../middlewares/customer-sync.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../validators/common.validator";
import {
  customerMeQuerySchema,
  customerQuerySchema,
  syncCustomerSchema,
  updateCustomerProfileSchema,
  updateCustomerStatusSchema,
} from "./customer.validator";

const router = Router();

router.post(
  "/public/sync",
  requireCustomerSyncSecret,
  validateBody(syncCustomerSchema),
  customerController.syncFromGoogle,
);
router.get(
  "/public/me",
  requireCustomerSyncSecret,
  validateQuery(customerMeQuerySchema),
  customerController.getMe,
);
router.put(
  "/public/me",
  requireCustomerSyncSecret,
  validateBody(updateCustomerProfileSchema),
  customerController.updateMe,
);

router.use(authenticate);

router.get("/", validateQuery(customerQuerySchema), customerController.list);
router.get("/:id", validateParams(idParamSchema), customerController.getById);
router.put(
  "/:id/status",
  validateParams(idParamSchema),
  validateBody(updateCustomerStatusSchema),
  customerController.updateStatus,
);

export default router;
