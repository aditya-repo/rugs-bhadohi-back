import { Router } from "express";
import { categoryController } from "./category.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../validators/common.validator";
import { categoryQuerySchema, createCategorySchema, updateCategorySchema } from "./category.validator";

const router = Router();

router.get("/public/homepage", categoryController.listPublicHomepage);
router.get("/public/list", categoryController.listPublicActive);

router.use(authenticate);

router.get("/", validateQuery(categoryQuerySchema), categoryController.list);
router.get("/tree", categoryController.tree);
router.get("/:id", validateParams(idParamSchema), categoryController.getById);
router.post("/", validateBody(createCategorySchema), categoryController.create);
router.put("/:id", validateParams(idParamSchema), validateBody(updateCategorySchema), categoryController.update);
router.delete("/:id", validateParams(idParamSchema), categoryController.delete);

export default router;
