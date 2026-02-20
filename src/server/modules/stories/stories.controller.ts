import type { Context } from "hono";
import type { AppBindings } from "@/src/server/types";
import { isServiceError } from "@/src/server/utils/service-error";
import { storiesService } from "./stories.service";

type StoriesContext = Context<AppBindings>;

const handleError = (c: StoriesContext, error: unknown, fallback: string) => {
  if (isServiceError(error)) {
    return c.json({ message: error.message }, error.status as 400);
  }
  console.error(`[stories] ${fallback}:`, error);
  return c.json({ message: fallback }, 500);
};

export const storiesController = {
  async list(c: StoriesContext) {
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
      const result = await storiesService.list(c.get("user"), {
        cursor,
        limit,
        mode,
        includeBanned,
      });
      return c.json(result);
    } catch (error) {
      return handleError(c, error, "Failed to fetch stories");
    }
  },

  async getById(c: StoriesContext) {
    try {
      const story = await storiesService.findOne(c.get("user"), c.req.param("id"));
      return c.json({ story });
    } catch (error) {
      return handleError(c, error, "Failed to fetch story");
    }
  },

  async listComments(c: StoriesContext) {
    try {
      const comments = await storiesService.listComments(c.req.param("id"));
      return c.json({ comments });
    } catch (error) {
      return handleError(c, error, "Failed to fetch comments");
    }
  },

  async addComment(c: StoriesContext) {
    try {
      const payload = (await c.req.json()) as Record<string, unknown>;
      const created = await storiesService.addComment(
        c.get("user"),
        c.req.param("id"),
        payload,
      );
      return c.json(created, 201);
    } catch (error) {
      return handleError(c, error, "Failed to add comment");
    }
  },

  async deleteComment(c: StoriesContext) {
    try {
      await storiesService.deleteComment(
        c.get("user"),
        c.req.param("id"),
        c.req.param("commentId"),
      );
      return c.json({ message: "Deleted" });
    } catch (error) {
      return handleError(c, error, "Failed to delete comment");
    }
  },

  async toggleLike(c: StoriesContext) {
    try {
      const result = await storiesService.toggleLike(c.get("user"), c.req.param("id"));
      return c.json(result);
    } catch (error) {
      return handleError(c, error, "Failed to toggle like");
    }
  },

  async incrementRead(c: StoriesContext) {
    try {
      const result = await storiesService.incrementRead(c.get("user"), c.req.param("id"));
      return c.json(result);
    } catch (error) {
      return handleError(c, error, "Failed to increment read count");
    }
  },

  async create(c: StoriesContext) {
    try {
      const payload = (await c.req.json()) as Record<string, unknown>;
      const result = await storiesService.create(c.get("user"), payload);
      return c.json(result, 201);
    } catch (error) {
      return handleError(c, error, "Failed to create story");
    }
  },

  async update(c: StoriesContext) {
    try {
      const payload = (await c.req.json()) as Record<string, unknown>;
      await storiesService.update(c.get("user"), c.req.param("id"), payload);
      return c.json({ message: "Updated" });
    } catch (error) {
      return handleError(c, error, "Failed to update story");
    }
  },

  async remove(c: StoriesContext) {
    try {
      await storiesService.remove(c.get("user"), c.req.param("id"));
      return c.json({ message: "Deleted" });
    } catch (error) {
      return handleError(c, error, "Failed to delete story");
    }
  },

  async ban(c: StoriesContext) {
    try {
      const payload = (await c.req.json().catch(() => ({}))) as { reason?: string };
      await storiesService.ban(c.get("user"), c.req.param("id"), payload.reason);
      return c.json({ message: "Story banned" });
    } catch (error) {
      return handleError(c, error, "Failed to ban story");
    }
  },

  async unban(c: StoriesContext) {
    try {
      await storiesService.unban(c.get("user"), c.req.param("id"));
      return c.json({ message: "Story unbanned" });
    } catch (error) {
      return handleError(c, error, "Failed to unban story");
    }
  },
};
