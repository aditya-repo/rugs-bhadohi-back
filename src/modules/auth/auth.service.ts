import {
  getPasswordResetExpiry,
  getRefreshTokenExpiry,
  signAccessToken,
  signRefreshToken,
} from "../../config/jwt";
import { UnauthorizedError, NotFoundError, ValidationError } from "../../utils/errors";
import { generateRandomToken } from "../../utils/helpers";
import { passwordService } from "../../services/password.service";
import { emailService } from "../../services/email.service";
import { activityService } from "../../services/activity.service";
import { authRepository } from "./auth.repository";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from "./auth.validator";

function sanitizeAdmin(admin: { id: string; email: string; name: string; avatar: string | null; lastLoginAt: Date | null; createdAt: Date }) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    avatar: admin.avatar,
    lastLoginAt: admin.lastLoginAt,
    createdAt: admin.createdAt,
  };
}

export class AuthService {
  async login(input: LoginInput, ipAddress?: string) {
    const admin = await authRepository.findByEmail(input.email);
    if (!admin) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const valid = await passwordService.compare(input.password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    await authRepository.updateLastLogin(admin.id);

    const accessToken = signAccessToken({ sub: admin.id, email: admin.email });
    const refreshToken = signRefreshToken({ sub: admin.id, email: admin.email });
    await authRepository.createRefreshToken(admin.id, refreshToken, getRefreshTokenExpiry());

    await activityService.log({
      adminId: admin.id,
      action: "LOGIN",
      entity: "admin",
      entityId: admin.id,
      ipAddress,
    });

    return {
      admin: sanitizeAdmin(admin),
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const stored = await authRepository.findRefreshToken(refreshToken);
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const accessToken = signAccessToken({
      sub: stored.admin.id,
      email: stored.admin.email,
    });

    return { accessToken };
  }

  async logout(refreshToken: string, adminId?: string) {
    await authRepository.deleteRefreshToken(refreshToken);
    if (adminId) {
      await activityService.log({
        adminId,
        action: "LOGOUT",
        entity: "admin",
        entityId: adminId,
      });
    }
  }

  async forgotPassword(input: ForgotPasswordInput) {
    const admin = await authRepository.findByEmail(input.email);
    if (!admin) {
      return { message: "If the email exists, a reset link has been sent" };
    }

    const token = generateRandomToken(48);
    await authRepository.createPasswordResetToken(admin.id, token, getPasswordResetExpiry());
    await emailService.sendPasswordResetEmail(admin.email, token);

    return { message: "If the email exists, a reset link has been sent" };
  }

  async resetPassword(input: ResetPasswordInput) {
    const resetToken = await authRepository.findPasswordResetToken(input.token);
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new ValidationError("Invalid or expired reset token");
    }

    const passwordHash = await passwordService.hash(input.password);
    await authRepository.updatePassword(resetToken.adminId, passwordHash);
    await authRepository.markPasswordResetUsed(resetToken.id);
    await authRepository.deleteAllRefreshTokens(resetToken.adminId);

    return { message: "Password reset successfully" };
  }

  async getProfile(adminId: string) {
    const admin = await authRepository.findById(adminId);
    if (!admin) throw new NotFoundError("Admin not found");
    return sanitizeAdmin(admin);
  }

  async updateProfile(adminId: string, input: UpdateProfileInput) {
    const admin = await authRepository.updateProfile(adminId, input);
    return sanitizeAdmin(admin);
  }

  async changePassword(adminId: string, input: ChangePasswordInput) {
    const admin = await authRepository.findById(adminId);
    if (!admin) throw new NotFoundError("Admin not found");

    const valid = await passwordService.compare(input.currentPassword, admin.passwordHash);
    if (!valid) {
      throw new ValidationError("Current password is incorrect");
    }

    const passwordHash = await passwordService.hash(input.newPassword);
    await authRepository.updatePassword(adminId, passwordHash);
    await authRepository.deleteAllRefreshTokens(adminId);

    return { message: "Password changed successfully" };
  }
}

export const authService = new AuthService();
