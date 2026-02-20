import type { Context } from "hono";
import type { AppBindings } from "@/src/server/types";
import { isServiceError } from "@/src/server/utils/service-error";
import { poemsEvents } from "./poems.events";
import { poemsService } from "./poems.service";

type PoemsContext = Context<AppBindings>;

const handleError = (c: PoemsContext, error: unknown, fallback: string) => {
  if (isServiceError(error)) {
    return c.json({ message: error.message }, error.status as 400);
  }
  console.error(`[poems] ${fallback}:`, error);
  return c.json({ message: fallback }, 500);
};

export const poemsController = {
  async list(c: PoemsContext) {
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
      const result = await poemsService.list(c.get("user"), {
        cursor,
        limit,
        mode,
        includeBanned,
      });
      return c.json(result);
    } catch (error) {
      return handleError(c, error, "Failed to fetch poems");
    }
  },

  async stream(c: PoemsContext) {
    try {
      c.get("user");
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      const encoder = new TextEncoder();
      let closed = false;

      let writeQueue = Promise.resolve();
      const writeMessage = (event: string, data: unknown) => {
        if (closed) return;
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        writeQueue = writeQueue
          .then(() => writer.write(encoder.encode(payload)))
          .catch(() => undefined);
      };

      writeMessage("ready", { connected: true, at: new Date().toISOString() });

      const unsubscribe = poemsEvents.subscribe((payload) => {
        writeMessage("poem", payload);
      });

      const heartbeat = setInterval(() => {
        if (closed) return;
        writeQueue = writeQueue
          .then(() => writer.write(encoder.encode(": ping\n\n")))
          .catch(() => undefined);
      }, 15_000);

      const close = () => {
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
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
      return handleError(c, error, "Failed to open poems stream");
    }
  },

  async getById(c: PoemsContext) {
    try {
      const poem = await poemsService.findOne(c.get("user"), c.req.param("id"));
      return c.json({ poem });
    } catch (error) {
      return handleError(c, error, "Failed to fetch poem");
    }
  },

  async create(c: PoemsContext) {
    try {
      const payload = (await c.req.json()) as Record<string, unknown>;
      const created = await poemsService.create(c.get("user"), payload);
      return c.json(created, 201);
    } catch (error) {
      return handleError(c, error, "Failed to create poem");
    }
  },

  async update(c: PoemsContext) {
    try {
      const payload = (await c.req.json()) as Record<string, unknown>;
      await poemsService.update(c.get("user"), c.req.param("id"), payload);
      return c.json({ message: "Updated" });
    } catch (error) {
      return handleError(c, error, "Failed to update poem");
    }
  },

  async remove(c: PoemsContext) {
    try {
      await poemsService.remove(c.get("user"), c.req.param("id"));
      return c.json({ message: "Deleted" });
    } catch (error) {
      return handleError(c, error, "Failed to delete poem");
    }
  },

  async incrementRead(c: PoemsContext) {
    try {
      const result = await poemsService.incrementRead(c.get("user"), c.req.param("id"));
      return c.json(result);
    } catch (error) {
      return handleError(c, error, "Failed to increment read count");
    }
  },

  async ban(c: PoemsContext) {
    try {
      const payload = (await c.req.json().catch(() => ({}))) as { reason?: string };
      await poemsService.ban(c.get("user"), c.req.param("id"), payload.reason);
      return c.json({ message: "Poem banned" });
    } catch (error) {
      return handleError(c, error, "Failed to ban poem");
    }
  },

  async unban(c: PoemsContext) {
    try {
      await poemsService.unban(c.get("user"), c.req.param("id"));
      return c.json({ message: "Poem unbanned" });
    } catch (error) {
      return handleError(c, error, "Failed to unban poem");
    }
  },
};
