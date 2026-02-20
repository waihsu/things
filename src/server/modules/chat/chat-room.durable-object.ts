import { isServiceError } from "@/src/server/utils/service-error";
import {
  chatService,
  type ChatDirectMessage,
  type ChatMessage,
  type ChatParticipant,
} from "./chat.service";

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

type SocketAttachment = {
  connectionId: string;
  participant: ChatParticipant;
};

type DurableSocket = WebSocket & {
  serializeAttachment: (value: unknown) => void;
  deserializeAttachment: () => unknown;
};

type DurableWebSocketPair = {
  0: WebSocket;
  1: DurableSocket;
};

type WebSocketPairConstructor = new () => DurableWebSocketPair;

type DurableObjectStateLike = {
  acceptWebSocket: (socket: WebSocket) => void;
  getWebSockets: () => DurableSocket[];
};

const ROOM_NAME = "public-chat";
const PARTICIPANT_HEADER = "x-chat-participant";
const ONLINE_COUNT_PATH = "/online-count";

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isValidParticipant = (value: unknown): value is ChatParticipant => {
  if (!isObjectRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.guest === "boolean" &&
    (typeof value.avatar === "string" || value.avatar === null) &&
    (typeof value.username === "string" || value.username === null)
  );
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

export class ChatRoomDurableObject {
  private readonly state: DurableObjectStateLike;
  private readonly socketsByConnectionId = new Map<string, DurableSocket>();
  private readonly participantsByConnectionId = new Map<string, ChatParticipant>();

  constructor(state: unknown) {
    this.state = state as DurableObjectStateLike;
    this.restoreConnections();
  }

  private restoreConnections() {
    for (const socket of this.state.getWebSockets()) {
      const attachment = this.readAttachment(socket);
      if (!attachment) continue;
      this.socketsByConnectionId.set(attachment.connectionId, socket);
      this.participantsByConnectionId.set(
        attachment.connectionId,
        attachment.participant,
      );
    }
  }

  private readAttachment(socket: DurableSocket): SocketAttachment | null {
    const raw = socket.deserializeAttachment();
    if (!isObjectRecord(raw)) {
      return null;
    }

    const connectionId = raw.connectionId;
    const participant = raw.participant;
    if (typeof connectionId !== "string" || !isValidParticipant(participant)) {
      return null;
    }

    return { connectionId, participant };
  }

  private getOnlineCount() {
    const userIds = new Set<string>();
    for (const participant of this.participantsByConnectionId.values()) {
      userIds.add(participant.id);
    }
    return userIds.size;
  }

  private sendEvent(socket: WebSocket, event: ChatOutgoingEvent) {
    socket.send(JSON.stringify(event));
  }

  private broadcast(event: ChatOutgoingEvent) {
    const payload = JSON.stringify(event);
    for (const socket of this.socketsByConnectionId.values()) {
      socket.send(payload);
    }
  }

  private sendToUsers(userIds: string[], event: ChatOutgoingEvent) {
    const payload = JSON.stringify(event);
    const unique = new Set(userIds);

    for (const [connectionId, participant] of this.participantsByConnectionId.entries()) {
      if (participant.guest || !unique.has(participant.id)) {
        continue;
      }

      const socket = this.socketsByConnectionId.get(connectionId);
      if (!socket) {
        continue;
      }

      socket.send(payload);
    }
  }

  private removeConnectionBySocket(socket: DurableSocket) {
    const attachment = this.readAttachment(socket);
    if (!attachment) {
      return;
    }

    this.socketsByConnectionId.delete(attachment.connectionId);
    this.participantsByConnectionId.delete(attachment.connectionId);
    this.broadcast({
      type: "chat:online",
      payload: {
        online_count: this.getOnlineCount(),
      },
    });
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname.endsWith(ONLINE_COUNT_PATH)) {
      return Response.json({
        online_count: this.getOnlineCount(),
      });
    }

    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
      return new Response("Expected websocket upgrade", { status: 426 });
    }

    const participantEncoded = request.headers.get(PARTICIPANT_HEADER);
    if (!participantEncoded) {
      return new Response("Missing participant payload", { status: 400 });
    }

    let participant: ChatParticipant;
    try {
      const parsed = JSON.parse(decodeURIComponent(participantEncoded)) as unknown;
      if (!isValidParticipant(parsed)) {
        return new Response("Invalid participant payload", { status: 400 });
      }
      participant = parsed;
    } catch {
      return new Response("Invalid participant payload", { status: 400 });
    }

    const webSocketPairCtor = (
      globalThis as typeof globalThis & {
        WebSocketPair?: WebSocketPairConstructor;
      }
    ).WebSocketPair;
    if (!webSocketPairCtor) {
      return new Response("WebSocket runtime is unavailable", { status: 500 });
    }

    const pair = new webSocketPairCtor();
    const client = pair[0];
    const server = pair[1];
    const connectionId = crypto.randomUUID();

    this.state.acceptWebSocket(server);
    server.serializeAttachment({ connectionId, participant } satisfies SocketAttachment);

    this.socketsByConnectionId.set(connectionId, server);
    this.participantsByConnectionId.set(connectionId, participant);

    const onlineCount = this.getOnlineCount();
    this.sendEvent(server, {
      type: "chat:welcome",
      payload: {
        online_count: onlineCount,
        user: participant,
      },
    });
    this.broadcast({
      type: "chat:online",
      payload: {
        online_count: onlineCount,
      },
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    } as ResponseInit);
  }

  async webSocketMessage(socket: DurableSocket, message: string | ArrayBuffer) {
    const attachment = this.readAttachment(socket);
    if (!attachment) {
      this.sendEvent(socket, {
        type: "chat:error",
        payload: {
          message: "Connection metadata is missing",
        },
      });
      return;
    }

    try {
      const decoded = await decodeEventData(message);
      const parsed = parseIncomingMessage(decoded);

      if (!parsed || typeof parsed.type !== "string") {
        this.sendEvent(socket, {
          type: "chat:error",
          payload: {
            message: "Invalid chat message payload",
          },
        });
        return;
      }

      if (parsed.type === "chat:message") {
        const created = await chatService.createMessage(attachment.participant, parsed.text);
        if (!created) {
          this.sendEvent(socket, {
            type: "chat:error",
            payload: {
              message: "Message cannot be empty",
            },
          });
          return;
        }

        this.broadcast({
          type: "chat:message",
          payload: created,
        });
        return;
      }

      if (parsed.type === "chat:dm") {
        const targetUserId =
          typeof parsed.to_user_id === "string" ? parsed.to_user_id : "";
        const created = await chatService.createDirectMessage({
          senderParticipant: attachment.participant,
          targetUserIdRaw: targetUserId,
          text: parsed.text,
        });

        this.sendToUsers([created.sender.id, created.recipient.id], {
          type: "chat:dm",
          payload: created,
        });
        return;
      }

      this.sendEvent(socket, {
        type: "chat:error",
        payload: {
          message: "Unsupported chat event type",
        },
      });
    } catch (error) {
      if (isServiceError(error)) {
        this.sendEvent(socket, {
          type: "chat:error",
          payload: {
            message: error.message,
          },
        });
        return;
      }
      console.error("[chat] failed to process websocket message in durable object:", error);
      this.sendEvent(socket, {
        type: "chat:error",
        payload: {
          message: "Failed to deliver message",
        },
      });
    }
  }

  webSocketClose(socket: DurableSocket) {
    this.removeConnectionBySocket(socket);
  }

  webSocketError(socket: DurableSocket) {
    this.removeConnectionBySocket(socket);
  }
}

export const getChatRoomStub = (bindings: {
  CHAT_ROOM?: {
    idFromName: (name: string) => unknown;
    get: (id: unknown) => {
      fetch: (request: Request) => Promise<Response>;
    };
  };
}) => {
  const namespace = bindings.CHAT_ROOM;
  if (!namespace) return null;
  const id = namespace.idFromName(ROOM_NAME);
  return namespace.get(id);
};

export const chatRoomOnlineCountRequest = () =>
  new Request(`https://chat.internal${ONLINE_COUNT_PATH}`, { method: "GET" });

export const participantHeaderName = PARTICIPANT_HEADER;
