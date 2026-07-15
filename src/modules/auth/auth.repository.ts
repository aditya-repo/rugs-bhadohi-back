import { prisma } from "../../config/database";

export class AuthRepository {
  findByEmail(email: string) {
    return prisma.admin.findUnique({ where: { email } });
  }

  findById(id: string) {
    return prisma.admin.findUnique({ where: { id } });
  }

  updateLastLogin(id: string) {
    return prisma.admin.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  createRefreshToken(adminId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { adminId, token, expiresAt },
    });
  }

  findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { admin: true },
    });
  }

  deleteRefreshToken(token: string) {
    return prisma.refreshToken.delete({ where: { token } }).catch(() => null);
  }

  deleteAllRefreshTokens(adminId: string) {
    return prisma.refreshToken.deleteMany({ where: { adminId } });
  }

  createPasswordResetToken(adminId: string, token: string, expiresAt: Date) {
    return prisma.passwordResetToken.create({
      data: { adminId, token, expiresAt },
    });
  }

  findPasswordResetToken(token: string) {
    return prisma.passwordResetToken.findUnique({
      where: { token },
      include: { admin: true },
    });
  }

  markPasswordResetUsed(id: string) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  updatePassword(id: string, passwordHash: string) {
    return prisma.admin.update({
      where: { id },
      data: { passwordHash },
    });
  }

  updateProfile(id: string, data: { name?: string; avatar?: string }) {
    return prisma.admin.update({ where: { id }, data });
  }
}

export const authRepository = new AuthRepository();
