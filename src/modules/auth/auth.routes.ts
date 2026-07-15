import { Router } from "express";
import { authController } from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "./auth.validator";

const router = Router();

router.post("/login", validateBody(loginSchema), authController.login);
router.post("/refresh", validateBody(refreshTokenSchema), authController.refresh);
router.post("/logout", validateBody(refreshTokenSchema), authController.logout);
router.post("/forgot-password", validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", validateBody(resetPasswordSchema), authController.resetPassword);

router.get("/profile", authenticate, authController.profile);
router.put("/profile", authenticate, validateBody(updateProfileSchema), authController.updateProfile);
router.put("/change-password", authenticate, validateBody(changePasswordSchema), authController.changePassword);

export default router;
