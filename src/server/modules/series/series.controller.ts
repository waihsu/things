import type { Context } from "hono";
import type { AppBindings } from "@/src/server/types";
import { isServiceError } from "@/src/server/utils/service-error";
import { seriesService } from "./series.service";

type SeriesContext = Context<AppBindings>;

const handleError = (c: SeriesContext, error: unknown, fallback: string) => {
  if (isServiceError(error)) {
    return c.json({ message: error.message }, error.status as 400);
  }
  console.error(`[series] ${fallback}:`, error);
  return c.json({ message: fallback }, 500);
};

export const seriesController = {
  async list(c: SeriesContext) {
    try {
      const cursor = c.req.query("cursor");
      const limitRaw = c.req.query("limit");
      const mode = c.req.query("mode");
      const includeBannedRaw = c.req.query("include_banned");
      const limit = typeof limitRaw === "string" ? Number(limitRaw) : undefined;
      const includeBanned =
        includeBannedRaw === "1" ||
        includeBannedRaw === "true" ||
        includeBannedRaw === "yes";
      const result = await seriesService.list(c.get("user"), {
        cursor,
        limit,
        mode,
        includeBanned,
      });
      return c.json(result);
    } catch (error) {
      return handleError(c, error, "Failed to fetch series");
    }
  },

  async getById(c: SeriesContext) {
    try {
      const series = await seriesService.findOne(c.get("user"), c.req.param("id"));
      return c.json({ series });
    } catch (error) {
      return handleError(c, error, "Failed to fetch series");
    }
  },

  async listComments(c: SeriesContext) {
    try {
      const comments = await seriesService.listComments(c.req.param("id"));
      return c.json({ comments });
    } catch (error) {
      return handleError(c, error, "Failed to fetch comments");
    }
  },

  async addComment(c: SeriesContext) {
    try {
      const payload = (await c.req.json()) as Record<string, unknown>;
      const created = await seriesService.addComment(
        c.get("user"),
        c.req.param("id"),
        payload,
      );
      return c.json(created, 201);
    } catch (error) {
      return handleError(c, error, "Failed to add comment");
    }
  },

  async deleteComment(c: SeriesContext) {
    try {
      await seriesService.deleteComment(
        c.get("user"),
        c.req.param("id"),
        c.req.param("commentId"),
      );
      return c.json({ message: "Deleted" });
    } catch (error) {
      return handleError(c, error, "Failed to delete comment");
    }
  },

  async toggleLike(c: SeriesContext) {
    try {
      const result = await seriesService.toggleLike(c.get("user"), c.req.param("id"));
      return c.json(result);
    } catch (error) {
      return handleError(c, error, "Failed to toggle like");
    }
  },

  async incrementRead(c: SeriesContext) {
    try {
      const result = await seriesService.incrementRead(c.get("user"), c.req.param("id"));
      return c.json(result);
    } catch (error) {
      return handleError(c, error, "Failed to increment read count");
    }
  },

  async create(c: SeriesContext) {
    try {
      const payload = (await c.req.json()) as Record<string, unknown>;
      const created = await seriesService.create(c.get("user"), payload);
      return c.json(created, 201);
    } catch (error) {
      return handleError(c, error, "Failed to create series");
    }
  },

  async update(c: SeriesContext) {
    try {
      const payload = (await c.req.json()) as Record<string, unknown>;
      await seriesService.update(c.get("user"), c.req.param("id"), payload);
      return c.json({ message: "Updated" });
    } catch (error) {
      return handleError(c, error, "Failed to update series");
    }
  },

  async remove(c: SeriesContext) {
    try {
      await seriesService.remove(c.get("user"), c.req.param("id"));
      return c.json({ message: "Deleted" });
    } catch (error) {
      return handleError(c, error, "Failed to delete series");
    }
  },

  async ban(c: SeriesContext) {
    try {
      const payload = (await c.req.json().catch(() => ({}))) as { reason?: string };
      await seriesService.ban(c.get("user"), c.req.param("id"), payload.reason);
      return c.json({ message: "Series banned" });
    } catch (error) {
      return handleError(c, error, "Failed to ban series");
    }
  },

  async unban(c: SeriesContext) {
    try {
      await seriesService.unban(c.get("user"), c.req.param("id"));
      return c.json({ message: "Series unbanned" });
    } catch (error) {
      return handleError(c, error, "Failed to unban series");
    }
  },
};
