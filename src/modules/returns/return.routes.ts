import { Router } from "express";
import { returnController } from "./return.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../validators/common.validator";
import { returnQuerySchema, updateReturnStatusSchema } from "./return.validator";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(returnQuerySchema), returnController.list);
router.get("/:id", validateParams(idParamSchema), returnController.getById);
router.put("/:id/status", validateParams(idParamSchema), validateBody(updateReturnStatusSchema), returnController.updateStatus);
router.put("/:id/approve", validateParams(idParamSchema), returnController.approve);
router.put("/:id/reject", validateParams(idParamSchema), returnController.reject);

export default router;
