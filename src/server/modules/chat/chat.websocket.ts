import type { ServerWebSocket } from "bun";
import { auth } from "@/src/server/lib/auth";
import { isServiceError } from "@/src/server/utils/service-error";
import {
  chatService,
  type ChatDirectMessage,
  type ChatMessage,
  type ChatParticipant,
} from "./chat.service";
import {
  initChatRedisBridge,
  isChatRedisBridgeReady,
  publishChatDirectMessage,
  publishChatMessage,
} from "./chat.redis-bus";

type ChatIncomingMessage = {
  type?: unknown;
  text?: unknown;
  to_user_id?: unknown;
};

type ChatOutgoingEvent =
  | {
      type: "chat:welcome";
      payload: {
        online_count: number;
        user: ChatParticipant;
      };
    }
  | {
      type: "chat:online";
      payload: {
        online_count: number;
      };
    }
  | {
      type: "chat:message";
      payload: ChatMessage;
    }
  | {
      type: "chat:dm";
      payload: ChatDirectMessage;
    }
  | {
      type: "chat:error";
      payload: {
        message: string;
      };
    };

export type ChatSocketData = {
  connectionId: string;
  participant: ChatParticipant;
};

const isBannedUser = (user: unknown) => {
  if (!user || typeof user !== "object") {
    return false;
  }
  return (user as { banned?: unknown }).banned === true;
};

const clients = new Set<ServerWebSocket<ChatSocketData>>();
const userSocketsByUserId = new Map<string, Set<ServerWebSocket<ChatSocketData>>>();
let redisBridgeInitStarted = false;

const sendEvent = (ws: ServerWebSocket<ChatSocketData>, event: ChatOutgoingEvent) => {
  ws.send(JSON.stringify(event));
};

const broadcast = (event: ChatOutgoingEvent) => {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    client.send(payload);
  }
};

const addAuthenticatedSocket = (ws: ServerWebSocket<ChatSocketData>) => {
  const participant = ws.data.participant;
  if (participant.guest) {
    return;
  }

  const current = userSocketsByUserId.get(participant.id);
  if (current) {
    current.add(ws);
    return;
  }

  userSocketsByUserId.set(participant.id, new Set([ws]));
};

const removeAuthenticatedSocket = (ws: ServerWebSocket<ChatSocketData>) => {
  const participant = ws.data.participant;
  if (participant.guest) {
    return;
  }

  const current = userSocketsByUserId.get(participant.id);
  if (!current) {
    return;
  }

  current.delete(ws);
  if (current.size === 0) {
    userSocketsByUserId.delete(participant.id);
  }
};

const sendToUsers = (userIds: string[], event: ChatOutgoingEvent) => {
  const payload = JSON.stringify(event);
  const delivered = new Set<ServerWebSocket<ChatSocketData>>();

  for (const userId of userIds) {
    const sockets = userSocketsByUserId.get(userId);
    if (!sockets) {
      continue;
    }

    for (const socket of sockets) {
      if (delivered.has(socket)) {
        continue;
      }
      delivered.add(socket);
      socket.send(payload);
    }
  }
};

const ensureRedisBridge = () => {
  if (redisBridgeInitStarted) {
    return;
  }

  redisBridgeInitStarted = true;
  void initChatRedisBridge((event) => {
    if (event.type === "chat:message") {
      broadcast({
        type: "chat:message",
        payload: event.payload,
      });
      return;
    }

    if (event.type === "chat:dm") {
      sendToUsers(event.recipient_user_ids, {
        type: "chat:dm",
        payload: event.payload,
      });
    }
  });
};

const readRawMessage = (message: string | Buffer | ArrayBuffer | Uint8Array) => {
  if (typeof message === "string") return message;
  if (message instanceof ArrayBuffer) return new TextDecoder().decode(message);
  if (message instanceof Uint8Array) return new TextDecoder().decode(message);
  return (message as Buffer).toString();
};

const parseIncomingMessage = (raw: string): ChatIncomingMessage | null => {
  try {
    return JSON.parse(raw) as ChatIncomingMessage;
  } catch {
    return null;
  }
};

export async function handleChatWebSocketUpgrade(
  req: Request,
  server: Bun.Server<ChatSocketData>,
) {
  const url = new URL(req.url);
  if (url.pathname !== "/api/v1/chat/ws") {
    return false;
  }

  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
  try {
    session = await auth.api.getSession({ headers: req.headers });
  } catch (error) {
    console.warn("[chat] failed to resolve websocket session:", error);
  }

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (isBannedUser(session.user)) {
    return new Response("Account is banned", { status: 403 });
  }

  const participant = chatService.resolveParticipant({
    user: session.user,
  });

  const upgraded = server.upgrade(req, {
    data: {
      connectionId: crypto.randomUUID(),
      participant,
    },
  });

  if (!upgraded) {
    return new Response("WebSocket upgrade failed", { status: 400 });
  }

  return;
}

export const chatWebSocketHandlers: Bun.WebSocketHandler<ChatSocketData> = {
  open(ws) {
    ensureRedisBridge();
    clients.add(ws);
    addAuthenticatedSocket(ws);
    const onlineCount = chatService.connect(
      ws.data.connectionId,
      ws.data.participant,
    );
    sendEvent(ws, {
      type: "chat:welcome",
      payload: {
        online_count: onlineCount,
        user: ws.data.participant,
      },
    });
    broadcast({
      type: "chat:online",
      payload: {
        online_count: onlineCount,
      },
    });
  },

  async message(ws, rawMessage) {
    try {
      const decoded = readRawMessage(rawMessage);
      const parsed = parseIncomingMessage(decoded);

      if (!parsed || typeof parsed.type !== "string") {
        sendEvent(ws, {
          type: "chat:error",
          payload: {
            message: "Invalid chat message payload",
          },
        });
        return;
      }

      if (parsed.type === "chat:message") {
        const message = await chatService.createMessage(ws.data.participant, parsed.text);
        if (!message) {
          sendEvent(ws, {
            type: "chat:error",
            payload: {
              message: "Message cannot be empty",
            },
          });
          return;
        }

        const event: ChatOutgoingEvent = {
          type: "chat:message",
          payload: message,
        };

        const published = await publishChatMessage(message);
        if (!published || !isChatRedisBridgeReady()) {
          broadcast(event);
        }
        return;
      }

      if (parsed.type === "chat:dm") {
        const targetUserId =
          typeof parsed.to_user_id === "string" ? parsed.to_user_id : "";
        const message = await chatService.createDirectMessage({
          senderParticipant: ws.data.participant,
          targetUserIdRaw: targetUserId,
          text: parsed.text,
        });

        const recipients = [message.sender.id, message.recipient.id];
        const event: ChatOutgoingEvent = {
          type: "chat:dm",
          payload: message,
        };

        const published = await publishChatDirectMessage(message, recipients);
        if (!published || !isChatRedisBridgeReady()) {
          sendToUsers(recipients, event);
        }
        return;
      }

      sendEvent(ws, {
        type: "chat:error",
        payload: {
          message: "Unsupported chat event type",
        },
      });
    } catch (error) {
      if (isServiceError(error)) {
        sendEvent(ws, {
          type: "chat:error",
          payload: {
            message: error.message,
          },
        });
        return;
      }
      console.error("[chat] failed to process websocket message:", error);
      sendEvent(ws, {
        type: "chat:error",
        payload: {
          message: "Failed to deliver message",
        },
      });
    }
  },

  close(ws) {
    clients.delete(ws);
    removeAuthenticatedSocket(ws);
    const onlineCount = chatService.disconnect(ws.data.connectionId);
    broadcast({
      type: "chat:online",
      payload: {
        online_count: onlineCount,
      },
    });
  },
};
