import { Router } from "express";
import { colorController } from "./color.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../validators/common.validator";
import {
  colorQuerySchema,
  createColorSchema,
  updateColorSchema,
} from "./color.validator";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(colorQuerySchema), colorController.list);
router.get("/active", colorController.listActive);
router.get("/:id", validateParams(idParamSchema), colorController.getById);
router.post("/", validateBody(createColorSchema), colorController.create);
router.put(
  "/:id",
  validateParams(idParamSchema),
  validateBody(updateColorSchema),
  colorController.update,
);
router.delete("/:id", validateParams(idParamSchema), colorController.delete);

export default router;
