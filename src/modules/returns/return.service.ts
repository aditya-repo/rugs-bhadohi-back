import { ReturnStatus } from "@prisma/client";
import { NotFoundError } from "../../utils/errors";
import { parsePagination } from "../../utils/helpers";
import { activityService } from "../../services/activity.service";
import { returnRepository } from "./return.repository";
import type { updateReturnStatusSchema } from "./return.validator";
import { z } from "zod";

type UpdateReturnInput = z.infer<typeof updateReturnStatusSchema>;

export class ReturnService {
  async list(query: Record<string, string | undefined>) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await returnRepository.findMany({
      skip,
      limit,
      search: query.search,
      status: query.status as ReturnStatus | undefined,
      type: query.type as "RETURN" | "EXCHANGE" | undefined,
    });
    return { items, page, limit, total };
  }

  async getById(id: string) {
    const request = await returnRepository.findById(id);
    if (!request) throw new NotFoundError("Return request not found");
    return request;
  }

  async updateStatus(id: string, input: UpdateReturnInput, adminId?: string) {
    await this.getById(id);
    await returnRepository.update(
      id,
      {
        status: input.status,
        adminNotes: input.adminNotes,
        pickupStatus: input.pickupStatus,
        refundStatus: input.refundStatus,
        admin: adminId ? { connect: { id: adminId } } : undefined,
      },
      input.status,
      input.note,
    );
    await activityService.log({
      adminId,
      action: "UPDATE_STATUS",
      entity: "return",
      entityId: id,
      metadata: { status: input.status },
    });
    return returnRepository.findById(id);
  }

  async approve(id: string, adminId?: string) {
    return this.updateStatus(id, { status: "APPROVED" }, adminId);
  }

  async reject(id: string, adminId?: string, note?: string) {
    return this.updateStatus(id, { status: "REJECTED", note }, adminId);
  }
}

export const returnService = new ReturnService();
