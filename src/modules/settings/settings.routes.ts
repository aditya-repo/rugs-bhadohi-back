import { Router } from "express";
import { settingsController } from "./settings.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { updateSettingsSchema } from "./settings.validator";

const router = Router();

router.get("/robots.txt", settingsController.robotsTxt);

router.use(authenticate);

router.get("/", settingsController.getAll);
router.put("/", validateBody(updateSettingsSchema), settingsController.update);

export default router;
