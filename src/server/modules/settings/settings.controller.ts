import type { Context } from "hono";
import type { AppBindings } from "@/src/server/types";
import { isServiceError } from "@/src/server/utils/service-error";
import { settingsService } from "./settings.service";

type SettingsContext = Context<AppBindings>;

const handleError = (c: SettingsContext, error: unknown, fallback: string) => {
  if (isServiceError(error)) {
    return c.json({ message: error.message }, error.status as 400);
  }
  console.error(`[settings] ${fallback}:`, error);
  return c.json({ message: fallback }, 500);
};

export const settingsController = {
  async get(c: SettingsContext) {
    try {
      const result = await settingsService.get(c.get("user"));
      return c.json(result);
    } catch (error) {
      return handleError(c, error, "Failed to fetch settings");
    }
  },

  async update(c: SettingsContext) {
    try {
      const payload = (await c.req.json()) as Record<string, unknown>;
      const result = await settingsService.update(c.get("user"), payload);
      return c.json(result);
    } catch (error) {
      return handleError(c, error, "Failed to update settings");
    }
  },

  async importFakeData(c: SettingsContext) {
    try {
      const result = await settingsService.importFakeData(c.get("user"));
      return c.json({ result });
    } catch (error) {
      return handleError(c, error, "Failed to import fake data");
    }
  },
};

