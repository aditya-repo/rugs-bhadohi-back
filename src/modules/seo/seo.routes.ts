import { Router } from "express";
import { seoController } from "./seo.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { updateProductSeoSchema, slugPreviewSchema } from "./seo.validator";
import { z } from "zod";

const productIdSchema = z.object({ productId: z.string().min(1) });

const router = Router();

router.use(authenticate);

router.get("/products/:productId", validateParams(productIdSchema), seoController.getProductSeo);
router.put("/products/:productId", validateParams(productIdSchema), validateBody(updateProductSeoSchema), seoController.updateProductSeo);
router.post("/slug/generate", validateBody(slugPreviewSchema), seoController.generateSlug);
router.post("/slug/preview", validateBody(slugPreviewSchema), seoController.previewSlug);

export default router;
