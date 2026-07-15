import { prisma } from "../../config/database";
import { DEFAULT_SETTINGS } from "./settings.validator";

export class SettingsRepository {
  async getAll() {
    return prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
  }

  async getByKey(key: string) {
    return prisma.siteSetting.findUnique({ where: { key } });
  }

  async upsert(key: string, value: unknown, group: string) {
    return prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: value as object, group },
      update: { value: value as object, group },
    });
  }

  async upsertMany(settings: Record<string, unknown>) {
    const ops = Object.entries(settings).map(([key, value]) => {
      const meta = DEFAULT_SETTINGS[key];
      return this.upsert(key, value, meta?.group ?? "general");
    });
    return Promise.all(ops);
  }
}

export const settingsRepository = new SettingsRepository();
