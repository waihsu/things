import type { Context } from "hono";
import type { AppBindings } from "@/src/server/types";
import { presenceEvents } from "./presence.events";
import { presenceService } from "./presence.service";

type PresenceContext = Context<AppBindings>;

const handleError = (c: PresenceContext, error: unknown, fallback: string) => {
  console.error(`[presence] ${fallback}:`, error);
  return c.json({ message: fallback }, 500);
};

export const presenceController = {
  async list(c: PresenceContext) {
    try {
      const ids = presenceService.parseIds(c.req.query("ids"));
      return c.json({ presence: presenceService.listStatuses(ids) });
    } catch (error) {
      return handleError(c, error, "Failed to fetch presence");
    }
  },

  async getByUserId(c: PresenceContext) {
    try {
      const userId = c.req.param("userId")?.trim();
      if (!userId) {
        return c.json({ message: "User id is required" }, 400);
      }

      return c.json({ presence: presenceService.getStatus(userId) });
    } catch (error) {
      return handleError(c, error, "Failed to fetch presence");
    }
  },

  async stream(c: PresenceContext) {
    try {
      const user = c.get("user");
      if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
      }

      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      const encoder = new TextEncoder();
      const connectionId = crypto.randomUUID();
      let closed = false;

      let writeQueue = Promise.resolve();
      const writeMessage = (event: string, data: unknown) => {
        if (closed) return;
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        writeQueue = writeQueue
          .then(() => writer.write(encoder.encode(payload)))
          .catch(() => undefined);
      };

      const currentUserStatus = presenceService.connect(user.id, connectionId);
      writeMessage("ready", {
        connected: true,
        at: new Date().toISOString(),
        self: currentUserStatus,
      });

      const unsubscribe = presenceEvents.subscribe((payload) => {
        writeMessage("presence", payload);
      });

      const heartbeat = setInterval(() => {
        if (closed) return;
        writeQueue = writeQueue
          .then(() => writer.write(encoder.encode(": ping\n\n")))
          .catch(() => undefined);
      }, 15_000);

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        presenceService.disconnect(user.id, connectionId);
        writeQueue
          .then(() => writer.close())
          .catch(() => undefined);
      };

      c.req.raw.signal.addEventListener("abort", close, { once: true });

      return new Response(stream.readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    } catch (error) {
      return handleError(c, error, "Failed to open presence stream");
    }
  },
};
