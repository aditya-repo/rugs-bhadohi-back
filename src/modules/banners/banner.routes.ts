import { Router } from "express";
import { bannerController } from "./banner.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { upload, setUploadFolder } from "../../middlewares/upload.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../validators/common.validator";
import { bannerQuerySchema, createBannerSchema, updateBannerSchema } from "./banner.validator";

const router = Router();

router.get("/public/homepage", bannerController.listPublicHomepage);

router.use(authenticate);

router.get("/", validateQuery(bannerQuerySchema), bannerController.list);
router.post("/upload", setUploadFolder("banners"), upload.array("images", 5), bannerController.upload);
router.get("/:id", validateParams(idParamSchema), bannerController.getById);
router.post("/", validateBody(createBannerSchema), bannerController.create);
router.put("/:id", validateParams(idParamSchema), validateBody(updateBannerSchema), bannerController.update);
router.delete("/:id", validateParams(idParamSchema), bannerController.delete);
router.put("/:id/enable", validateParams(idParamSchema), bannerController.enable);
router.put("/:id/disable", validateParams(idParamSchema), bannerController.disable);

export default router;
