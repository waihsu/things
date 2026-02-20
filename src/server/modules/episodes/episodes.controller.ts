import type { Context } from "hono";
import type { AppBindings } from "@/src/server/types";
import { episodesService } from "./episodes.service";
import { isServiceError } from "@/src/server/utils/service-error";

type EpisodesContext = Context<AppBindings>;

const fail = (c: EpisodesContext, message: string, status = 500) =>
  c.json({ message }, status as 500);

const handleError = (c: EpisodesContext, error: unknown, fallback: string) => {
  if (isServiceError(error)) {
    return c.json({ message: error.message }, error.status as 400);
  }
  console.error(`[episodes] ${fallback}:`, error);
  return fail(c, fallback, 500);
};

export const episodesController = {
  async list(c: EpisodesContext) {
    try {
      const episodes = await episodesService.list(
        c.get("user"),
        c.req.query("series_id"),
      );
      return c.json({ episodes });
    } catch (error) {
      return handleError(c, error, "Failed to fetch episodes");
    }
  },

  async getById(c: EpisodesContext) {
    try {
      const episode = await episodesService.findOne(c.get("user"), c.req.param("id"));
      return c.json({ episode });
    } catch (error) {
      return handleError(c, error, "Failed to fetch episode");
    }
  },

  async create(c: EpisodesContext) {
    try {
      const payload = (await c.req.json()) as Record<string, unknown>;
      const created = await episodesService.create(c.get("user"), payload);
      return c.json(created, 201);
    } catch (error) {
      return handleError(c, error, "Failed to create episode");
    }
  },

  async update(c: EpisodesContext) {
    try {
      const payload = (await c.req.json()) as Record<string, unknown>;
      await episodesService.update(c.get("user"), c.req.param("id"), payload);
      return c.json({ message: "Updated" });
    } catch (error) {
      return handleError(c, error, "Failed to update episode");
    }
  },

  async remove(c: EpisodesContext) {
    try {
      await episodesService.remove(c.get("user"), c.req.param("id"));
      return c.json({ message: "Deleted" });
    } catch (error) {
      return handleError(c, error, "Failed to delete episode");
    }
  },
};
