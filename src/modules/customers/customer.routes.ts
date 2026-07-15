import { Router } from "express";
import { customerController } from "./customer.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../validators/common.validator";
import { customerQuerySchema, updateCustomerStatusSchema } from "./customer.validator";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(customerQuerySchema), customerController.list);
router.get("/:id", validateParams(idParamSchema), customerController.getById);
router.put("/:id/status", validateParams(idParamSchema), validateBody(updateCustomerStatusSchema), customerController.updateStatus);

export default router;
