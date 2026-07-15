import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import { AuthenticatedRequest } from "../../types/express";
import { dashboardService } from "./dashboard.service";

export class DashboardController {
  overview = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const data = await dashboardService.getOverview();
    sendSuccess(res, data);
  });

  analytics = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const data = await dashboardService.getAnalytics();
    sendSuccess(res, data);
  });

  latest = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const data = await dashboardService.getLatest();
    sendSuccess(res, data);
  });
}

export const dashboardController = new DashboardController();
