import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import { AuthenticatedRequest } from "../../types/express";
import { authService } from "./auth.service";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RefreshTokenInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from "./auth.validator";

export class AuthController {
  login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.login(req.body as LoginInput, req.ip);
    sendSuccess(res, result, "Login successful");
  });

  refresh = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { refreshToken } = req.body as RefreshTokenInput;
    const result = await authService.refresh(refreshToken);
    sendSuccess(res, result, "Token refreshed");
  });

  logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { refreshToken } = req.body as RefreshTokenInput;
    await authService.logout(refreshToken, req.admin?.id);
    sendSuccess(res, null, "Logged out successfully");
  });

  forgotPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.forgotPassword(req.body as ForgotPasswordInput);
    sendSuccess(res, result);
  });

  resetPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.resetPassword(req.body as ResetPasswordInput);
    sendSuccess(res, result);
  });

  profile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.getProfile(req.admin!.id);
    sendSuccess(res, result);
  });

  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.updateProfile(req.admin!.id, req.body as UpdateProfileInput);
    sendSuccess(res, result, "Profile updated");
  });

  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await authService.changePassword(req.admin!.id, req.body as ChangePasswordInput);
    sendSuccess(res, result);
  });
}

export const authController = new AuthController();
