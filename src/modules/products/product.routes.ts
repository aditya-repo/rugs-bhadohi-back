import { Router } from "express";
import { productController } from "./product.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { upload, setUploadFolder } from "../../middlewares/upload.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../validators/common.validator";
import {
  bulkCategorySchema,
  bulkIdsSchema,
  createProductSchema,
  productQuerySchema,
  publicProductListQuerySchema,
  reorderImagesSchema,
  updateProductSchema,
} from "./product.validator";

const router = Router();

router.get("/public/artist-collection", productController.listPublicArtistCollection);
router.get("/public/featured", productController.listPublicFeatured);
router.get(
  "/public/list",
  validateQuery(publicProductListQuerySchema),
  productController.listPublicCatalog,
);
router.get("/public/:idOrSlug", productController.getPublicByIdOrSlug);

router.use(authenticate);

router.get("/export", validateQuery(productQuerySchema), productController.exportProducts);
router.get("/", validateQuery(productQuerySchema), productController.list);
router.get("/:id", validateParams(idParamSchema), productController.getById);
router.post("/", validateBody(createProductSchema), productController.create);
router.put("/:id", validateParams(idParamSchema), validateBody(updateProductSchema), productController.update);
router.delete("/:id", validateParams(idParamSchema), productController.delete);

router.post("/:id/duplicate", validateParams(idParamSchema), productController.duplicate);
router.put("/:id/publish", validateParams(idParamSchema), productController.publish);
router.put("/:id/draft", validateParams(idParamSchema), productController.draft);
router.put("/:id/archive", validateParams(idParamSchema), productController.archive);

router.post("/bulk/delete", validateBody(bulkIdsSchema), productController.bulkDelete);
router.post("/bulk/publish", validateBody(bulkIdsSchema), productController.bulkPublish);
router.post("/bulk/draft", validateBody(bulkIdsSchema), productController.bulkDraft);
router.post("/bulk/category", validateBody(bulkCategorySchema), productController.bulkCategory);

router.post(
  "/:id/images",
  validateParams(idParamSchema),
  setUploadFolder("products"),
  upload.array("images", 20),
  productController.uploadImages,
);
router.put("/:id/images/reorder", validateParams(idParamSchema), validateBody(reorderImagesSchema), productController.reorderImages);
router.delete("/:id/images/:imageId", productController.deleteImage);

export default router;
