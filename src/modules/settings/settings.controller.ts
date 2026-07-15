import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import { AuthenticatedRequest } from "../../types/express";
import { settingsService } from "./settings.service";

export class SettingsController {
  getAll = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const settings = await settingsService.getAll();
    sendSuccess(res, settings);
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const settings = await settingsService.update(req.body.settings);
    sendSuccess(res, settings, "Settings updated");
  });

  robotsTxt = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const content = await settingsService.getRobotsTxt();
    res.type("text/plain").send(content);
  });
}

export const settingsController = new SettingsController();
