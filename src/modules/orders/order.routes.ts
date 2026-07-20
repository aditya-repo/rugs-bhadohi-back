import { Router } from "express";
import { orderController } from "./order.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireCustomerSyncSecret } from "../../middlewares/customer-sync.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../validators/common.validator";
import {
  createOrderNoteSchema,
  customerOrdersQuerySchema,
  orderQuerySchema,
  updateOrderStatusSchema,
} from "./order.validator";

const router = Router();

router.get(
  "/public/recent",
  requireCustomerSyncSecret,
  validateQuery(customerOrdersQuerySchema),
  orderController.listRecentForCustomer,
);

router.use(authenticate);

router.get("/", validateQuery(orderQuerySchema), orderController.list);
router.get("/:id", validateParams(idParamSchema), orderController.getById);
router.put(
  "/:id/status",
  validateParams(idParamSchema),
  validateBody(updateOrderStatusSchema),
  orderController.updateStatus,
);
router.post(
  "/:id/notes",
  validateParams(idParamSchema),
  validateBody(createOrderNoteSchema),
  orderController.addNote,
);
router.post(
  "/:id/invoice",
  validateParams(idParamSchema),
  orderController.generateInvoice,
);

export default router;
