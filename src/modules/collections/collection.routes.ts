import { Router } from "express";
import { collectionController } from "./collection.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../validators/common.validator";
import {
  collectionQuerySchema,
  createCollectionSchema,
  updateCollectionSchema,
} from "./collection.validator";

const router = Router();

router.get("/public/homepage", collectionController.listPublicHomepage);

router.use(authenticate);

router.get("/", validateQuery(collectionQuerySchema), collectionController.list);
router.get("/active", collectionController.listActive);
router.get("/:id", validateParams(idParamSchema), collectionController.getById);
router.post("/", validateBody(createCollectionSchema), collectionController.create);
router.put(
  "/:id",
  validateParams(idParamSchema),
  validateBody(updateCollectionSchema),
  collectionController.update,
);
router.delete("/:id", validateParams(idParamSchema), collectionController.delete);

export default router;
