import { env } from "../config/env";
import { logger } from "../config/logger";

export class EmailService {
  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL}/admin/reset-password?token=${resetToken}`;

    if (!env.SMTP_HOST) {
      logger.info(`Password reset link for ${to}: ${resetUrl}`);
      return;
    }

    // Production: integrate nodemailer or similar SMTP client
    logger.info(`Password reset email queued for ${to}`);
  }
}

export const emailService = new EmailService();
