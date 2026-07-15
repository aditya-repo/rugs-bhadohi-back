import { prisma } from "../config/database";
import { toJsonValue } from "../utils/prisma";

export class ActivityService {
  async log(params: {
    adminId?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<void> {
    await prisma.activityLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: toJsonValue(params.metadata),
        ipAddress: params.ipAddress,
      },
    });
  }

  async getRecent(limit = 20) {
    return prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
    });
  }
}

export const activityService = new ActivityService();
