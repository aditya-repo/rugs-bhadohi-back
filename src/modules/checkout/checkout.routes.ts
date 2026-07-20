import { Router } from "express";
import { requireCustomerSyncSecret } from "../../middlewares/customer-sync.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { checkoutController } from "./checkout.controller";
import {
  createCheckoutSessionSchema,
  verifyCheckoutSchema,
} from "./checkout.validator";

const router = Router();

router.post(
  "/public/session",
  requireCustomerSyncSecret,
  validateBody(createCheckoutSessionSchema),
  checkoutController.createSession,
);

router.post(
  "/public/verify",
  requireCustomerSyncSecret,
  validateBody(verifyCheckoutSchema),
  checkoutController.verify,
);

/** Cashfree server → us; authenticated via HMAC signature, not sync secret. */
router.post("/webhook/cashfree", checkoutController.cashfreeWebhook);

export default router;
