import type { Context } from "hono";
import type { AppBindings } from "@/src/server/types";
import { isServiceError } from "@/src/server/utils/service-error";
import { profileService } from "./profile.service";

type ProfileContext = Context<AppBindings>;

const handleError = (c: ProfileContext, error: unknown, fallback: string) => {
  if (isServiceError(error)) {
    return c.json({ message: error.message }, error.status as 400);
  }
  console.error(`[profile] ${fallback}:`, error);
  return c.json({ message: fallback }, 500);
};

export const profileController = {
  async getMyProfile(c: ProfileContext) {
    try {
      const profile = await profileService.getOwnProfile(c.get("user"));
      return c.json({ profile });
    } catch (error) {
      return handleError(c, error, "Failed to fetch profile");
    }
  },

  async getPublicProfile(c: ProfileContext) {
    try {
      const profile = await profileService.getPublicProfile(c.req.param("handle"));
      return c.json({ profile });
    } catch (error) {
      return handleError(c, error, "Failed to fetch public profile");
    }
  },

  async getUsers(c: ProfileContext) {
    try {
      const search = c.req.query("search") ?? "";
      const limit = c.req.query("limit");
      const offset = c.req.query("offset");
      const sortBy = c.req.query("sortBy") ?? "recent";

      const result = await profileService.listUsersForAdmin(c.get("user"), {
        search,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        sortBy,
      });
      return c.json(result);
    } catch (error) {
      return handleError(c, error, "Failed to fetch users");
    }
  },

  async banUser(c: ProfileContext) {
    try {
      const payload = (await c.req.json().catch(() => ({}))) as { reason?: string };
      await profileService.banUser(c.get("user"), c.req.param("id"), payload.reason);
      return c.json({ message: "User banned" });
    } catch (error) {
      return handleError(c, error, "Failed to ban user");
    }
  },

  async unbanUser(c: ProfileContext) {
    try {
      await profileService.unbanUser(c.get("user"), c.req.param("id"));
      return c.json({ message: "User unbanned" });
    } catch (error) {
      return handleError(c, error, "Failed to unban user");
    }
  },

  async update(c: ProfileContext) {
    try {
      const payload = (await c.req.json()) as Record<string, unknown>;
      const profile = await profileService.updateProfile(c.get("user"), payload);
      return c.json({ profile });
    } catch (error) {
      return handleError(c, error, "Failed to update profile");
    }
  },
};
