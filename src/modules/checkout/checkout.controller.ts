import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import { ValidationError } from "../../utils/errors";
import { checkoutService } from "./checkout.service";
import type {
  CreateCheckoutSessionInput,
  VerifyCheckoutInput,
} from "./checkout.validator";

type RawBodyRequest = Request & { rawBody?: string };

export class CheckoutController {
  createSession = asyncHandler(async (req: Request, res: Response) => {
    const data = await checkoutService.createSession(
      req.body as CreateCheckoutSessionInput,
    );
    sendSuccess(res, data, data.message, 201);
  });

  verify = asyncHandler(async (req: Request, res: Response) => {
    const data = await checkoutService.verifyPayment(req.body as VerifyCheckoutInput);
    sendSuccess(res, data, "Payment status retrieved");
  });

  cashfreeWebhook = asyncHandler(async (req: RawBodyRequest, res: Response) => {
    const signature = String(req.header("x-webhook-signature") ?? "");
    const timestamp = String(req.header("x-webhook-timestamp") ?? "");
    const rawBody =
      typeof req.rawBody === "string"
        ? req.rawBody
        : Buffer.isBuffer(req.body)
          ? req.body.toString("utf8")
          : JSON.stringify(req.body ?? {});

    if (!signature || !timestamp || !rawBody) {
      throw new ValidationError("Missing webhook signature, timestamp, or body");
    }

    const data = await checkoutService.handleCashfreeWebhook(
      rawBody,
      signature,
      timestamp,
    );
    sendSuccess(res, data, "Webhook processed");
  });
}

export const checkoutController = new CheckoutController();
