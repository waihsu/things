import type { Context } from "hono";
import type { AppBindings } from "@/src/server/types";
import { isServiceError } from "@/src/server/utils/service-error";
import { chatService } from "./chat.service";
import { readWorkerChatOnlineCount } from "./chat.websocket-worker";

type ChatContext = Context<AppBindings>;

const fallbackError = (c: ChatContext, error: unknown, fallback: string) => {
  if (isServiceError(error)) {
    return c.json({ message: error.message }, error.status as 400);
  }
  console.error(`[chat] ${fallback}:`, error);
  return c.json({ message: fallback }, 500);
};

const parseLimit = (
  raw: string | undefined,
  defaults: { fallback: number; min: number; max: number },
) => {
  const parsed = typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(parsed)) {
    return defaults.fallback;
  }
  return Math.max(defaults.min, Math.min(parsed, defaults.max));
};

export const chatController = {
  async list(c: ChatContext) {
    try {
      const limit = parseLimit(c.req.query("limit"), {
        fallback: 60,
        min: 1,
        max: 120,
      });
      const messages = await chatService.listMessages(limit);
      const workerOnlineCount = await readWorkerChatOnlineCount(c.env);

      return c.json({
        messages,
        online_count: workerOnlineCount ?? chatService.getOnlineCount(),
      });
    } catch (error) {
      return fallbackError(c, error, "Failed to fetch chat history");
    }
  },

  async listUsers(c: ChatContext) {
    try {
      const search = c.req.query("search") ?? "";
      const limit = parseLimit(c.req.query("limit"), {
        fallback: 30,
        min: 1,
        max: 60,
      });
      const users = await chatService.listDirectoryUsers(c.get("user"), {
        search,
        limit,
      });
      return c.json({ users });
    } catch (error) {
      return fallbackError(c, error, "Failed to fetch chat users");
    }
  },

  async listConversations(c: ChatContext) {
    try {
      const limit = parseLimit(c.req.query("limit"), {
        fallback: 30,
        min: 1,
        max: 80,
      });
      const conversations = await chatService.listDirectConversations(
        c.get("user"),
        limit,
      );
      return c.json({ conversations });
    } catch (error) {
      return fallbackError(c, error, "Failed to fetch chat conversations");
    }
  },

  async listDirectMessages(c: ChatContext) {
    try {
      const limit = parseLimit(c.req.query("limit"), {
        fallback: 80,
        min: 1,
        max: 120,
      });
      const result = await chatService.listDirectMessages(
        c.get("user"),
        c.req.param("userId"),
        limit,
      );
      return c.json(result);
    } catch (error) {
      return fallbackError(c, error, "Failed to fetch direct messages");
    }
  },
};
