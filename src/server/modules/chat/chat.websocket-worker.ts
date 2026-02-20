import { auth } from "@/src/server/lib/auth";
import type { AppBindings } from "@/src/server/types";
import { isServiceError } from "@/src/server/utils/service-error";
import {
  chatService,
  type ChatDirectMessage,
  type ChatMessage,
  type ChatParticipant,
} from "./chat.service";
import {
  chatRoomOnlineCountRequest,
  getChatRoomStub,
  participantHeaderName,
} from "./chat-room.durable-object";

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

type ActiveClient = {
  socket: CloudflareWorkerWebSocket;
  connectionId: string;
  participant: ChatParticipant;
};

type CloudflareWorkerWebSocket = WebSocket & {
  accept(): void;
};

type CloudflareWebSocketPair = {
  0: WebSocket;
  1: CloudflareWorkerWebSocket;
};

type WebSocketPairConstructor = new () => CloudflareWebSocketPair;

const clients = new Map<string, ActiveClient>();

const isBannedUser = (user: unknown) => {
  if (!user || typeof user !== "object") {
    return false;
  }
  return (user as { banned?: unknown }).banned === true;
};

const sendEvent = (socket: WebSocket, event: ChatOutgoingEvent) => {
  socket.send(JSON.stringify(event));
};

const broadcast = (event: ChatOutgoingEvent) => {
  const payload = JSON.stringify(event);
  for (const client of clients.values()) {
    try {
      client.socket.send(payload);
    } catch (error) {
      console.warn("[chat] failed to send websocket broadcast:", error);
    }
  }
};

const sendToUsers = (userIds: string[], event: ChatOutgoingEvent) => {
  const unique = new Set(userIds);
  const payload = JSON.stringify(event);

  for (const client of clients.values()) {
    if (client.participant.guest) {
      continue;
    }

    if (!unique.has(client.participant.id)) {
      continue;
    }

    try {
      client.socket.send(payload);
    } catch (error) {
      console.warn("[chat] failed to send direct websocket event:", error);
    }
  }
};

const parseIncomingMessage = (raw: string): ChatIncomingMessage | null => {
  try {
    return JSON.parse(raw) as ChatIncomingMessage;
  } catch {
    return null;
  }
};

const decodeEventData = async (value: unknown) => {
  if (typeof value === "string") return value;
  if (value instanceof ArrayBuffer) return new TextDecoder().decode(value);
  if (value instanceof Uint8Array) return new TextDecoder().decode(value);
  if (value instanceof Blob) return await value.text();
  return String(value ?? "");
};

const closeClient = (connectionId: string) => {
  if (!clients.delete(connectionId)) {
    return;
  }

  const onlineCount = chatService.disconnect(connectionId);
  broadcast({
    type: "chat:online",
    payload: {
      online_count: onlineCount,
    },
  });
};

export const readWorkerChatOnlineCount = async (
  bindings?: AppBindings["Bindings"],
) => {
  const roomStub = getChatRoomStub(bindings ?? {});
  if (!roomStub) {
    return null;
  }

  try {
    const response = await roomStub.fetch(chatRoomOnlineCountRequest());
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { online_count?: unknown };
    if (typeof payload.online_count !== "number") {
      return null;
    }

    return payload.online_count;
  } catch (error) {
    console.warn("[chat] failed to read online count from durable object:", error);
    return null;
  }
};

export const handleWorkerChatWebSocketUpgrade = async (
  request: Request,
  bindings?: AppBindings["Bindings"],
) => {
  const upgradeHeader = request.headers.get("Upgrade");
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected websocket upgrade", { status: 426 });
  }

  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
  try {
    session = await auth.api.getSession({ headers: request.headers });
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
  const roomStub = getChatRoomStub(bindings ?? {});
  if (roomStub) {
    const headers = new Headers(request.headers);
    headers.set(participantHeaderName, encodeURIComponent(JSON.stringify(participant)));

    const forwarded = new Request(request.url, {
      method: request.method,
      headers,
    });

    return roomStub.fetch(forwarded);
  }

  const webSocketPairCtor = (
    globalThis as typeof globalThis & {
      WebSocketPair?: WebSocketPairConstructor;
    }
  ).WebSocketPair;

  if (!webSocketPairCtor) {
    return new Response("WebSocket runtime is unavailable", { status: 500 });
  }

  const connectionId = crypto.randomUUID();
  const socketPair = new webSocketPairCtor();
  const clientSocket = socketPair[0];
  const serverSocket = socketPair[1];

  serverSocket.accept();
  clients.set(connectionId, {
    socket: serverSocket,
    connectionId,
    participant,
  });

  const onlineCount = chatService.connect(connectionId, participant);
  sendEvent(serverSocket, {
    type: "chat:welcome",
    payload: {
      online_count: onlineCount,
      user: participant,
    },
  });
  broadcast({
    type: "chat:online",
    payload: {
      online_count: onlineCount,
    },
  });

  serverSocket.addEventListener("message", async (event) => {
    try {
      const decoded = await decodeEventData(event.data);
      const parsed = parseIncomingMessage(decoded);

      if (!parsed || typeof parsed.type !== "string") {
        sendEvent(serverSocket, {
          type: "chat:error",
          payload: {
            message: "Invalid chat message payload",
          },
        });
        return;
      }

      if (parsed.type === "chat:message") {
        const message = await chatService.createMessage(participant, parsed.text);
        if (!message) {
          sendEvent(serverSocket, {
            type: "chat:error",
            payload: {
              message: "Message cannot be empty",
            },
          });
          return;
        }

        broadcast({
          type: "chat:message",
          payload: message,
        });
        return;
      }

      if (parsed.type === "chat:dm") {
        const targetUserId =
          typeof parsed.to_user_id === "string" ? parsed.to_user_id : "";
        const message = await chatService.createDirectMessage({
          senderParticipant: participant,
          targetUserIdRaw: targetUserId,
          text: parsed.text,
        });

        sendToUsers([message.sender.id, message.recipient.id], {
          type: "chat:dm",
          payload: message,
        });
        return;
      }

      sendEvent(serverSocket, {
        type: "chat:error",
        payload: {
          message: "Unsupported chat event type",
        },
      });
    } catch (error) {
      if (isServiceError(error)) {
        sendEvent(serverSocket, {
          type: "chat:error",
          payload: {
            message: error.message,
          },
        });
        return;
      }
      console.error("[chat] failed to process websocket message:", error);
      sendEvent(serverSocket, {
        type: "chat:error",
        payload: {
          message: "Failed to deliver message",
        },
      });
    }
  });

  serverSocket.addEventListener("close", () => {
    closeClient(connectionId);
  });

  serverSocket.addEventListener("error", () => {
    closeClient(connectionId);
  });

  return new Response(null, {
    status: 101,
    // Cloudflare Workers expects the accepted client socket in Response init.
    webSocket: clientSocket,
  } as ResponseInit);
};
