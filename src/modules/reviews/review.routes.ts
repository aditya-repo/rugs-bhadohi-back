import { Router } from "express";
import { reviewController } from "./review.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../validators/common.validator";
import { replyReviewSchema, rejectReviewSchema, reviewQuerySchema } from "./review.validator";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(reviewQuerySchema), reviewController.list);
router.get("/:id", validateParams(idParamSchema), reviewController.getById);
router.put("/:id/approve", validateParams(idParamSchema), reviewController.approve);
router.put("/:id/reject", validateParams(idParamSchema), validateBody(rejectReviewSchema), reviewController.reject);
router.put("/:id/reply", validateParams(idParamSchema), validateBody(replyReviewSchema), reviewController.reply);
router.delete("/:id", validateParams(idParamSchema), reviewController.delete);

export default router;
