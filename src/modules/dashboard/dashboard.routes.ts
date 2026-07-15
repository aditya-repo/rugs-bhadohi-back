import { Router } from "express";
import { dashboardController } from "./dashboard.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", dashboardController.overview);
router.get("/analytics", dashboardController.analytics);
router.get("/latest", dashboardController.latest);

export default router;
