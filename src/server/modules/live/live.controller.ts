import type { Context } from "hono";
import type { AppBindings } from "@/src/server/types";
import { isServiceError } from "@/src/server/utils/service-error";
import { liveContentEvents } from "./live.events";

type LiveContext = Context<AppBindings>;

const handleError = (c: LiveContext, error: unknown, fallback: string) => {
  if (isServiceError(error)) {
    return c.json({ message: error.message }, error.status as 400);
  }
  console.error(`[live] ${fallback}:`, error);
  return c.json({ message: fallback }, 500);
};

export const liveController = {
  async stream(c: LiveContext) {
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

      const unsubscribe = liveContentEvents.subscribe((payload) => {
        writeMessage("content", payload);
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
      return handleError(c, error, "Failed to open live stream");
    }
  },
};

