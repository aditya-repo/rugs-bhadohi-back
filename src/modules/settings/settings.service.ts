import { settingsRepository } from "./settings.repository";
import { DEFAULT_SETTINGS } from "./settings.validator";

export class SettingsService {
  async getAll() {
    const stored = await settingsRepository.getAll();
    const result: Record<string, unknown> = {};

    for (const [key, meta] of Object.entries(DEFAULT_SETTINGS)) {
      const setting = stored.find((s) => s.key === key);
      result[key] = setting ? setting.value : meta.value;
    }

    for (const setting of stored) {
      if (!(setting.key in result)) {
        result[setting.key] = setting.value;
      }
    }

    return result;
  }

  async update(settings: Record<string, unknown>) {
    await settingsRepository.upsertMany(settings);
    return this.getAll();
  }

  async getRobotsTxt(): Promise<string> {
    const setting = await settingsRepository.getByKey("robotsTxt");
    if (setting) return String((setting.value as { content?: string })?.content ?? setting.value);
    return String(DEFAULT_SETTINGS.robotsTxt.value);
  }
}

export const settingsService = new SettingsService();
