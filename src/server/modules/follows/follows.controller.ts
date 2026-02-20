import type { Context } from "hono";
import type { AppBindings } from "@/src/server/types";
import { isServiceError } from "@/src/server/utils/service-error";
import { followsService } from "./follows.service";

type FollowsContext = Context<AppBindings>;

const handleError = (c: FollowsContext, error: unknown, fallback: string) => {
  if (isServiceError(error)) {
    return c.json({ message: error.message }, error.status as 400);
  }
  console.error(`[follows] ${fallback}:`, error);
  return c.json({ message: fallback }, 500);
};

export const followsController = {
  async summary(c: FollowsContext) {
    try {
      const follow = await followsService.getSummary(
        c.req.param("userId"),
        c.get("user"),
      );
      return c.json({ follow });
    } catch (error) {
      return handleError(c, error, "Failed to fetch follow summary");
    }
  },

  async follow(c: FollowsContext) {
    try {
      const follow = await followsService.follow(c.req.param("userId"), c.get("user"));
      return c.json({ follow });
    } catch (error) {
      return handleError(c, error, "Failed to follow user");
    }
  },

  async unfollow(c: FollowsContext) {
    try {
      const follow = await followsService.unfollow(
        c.req.param("userId"),
        c.get("user"),
      );
      return c.json({ follow });
    } catch (error) {
      return handleError(c, error, "Failed to unfollow user");
    }
  },
};
