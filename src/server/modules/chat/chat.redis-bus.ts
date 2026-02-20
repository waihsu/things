import type { ChatDirectMessage, ChatMessage } from "./chat.service";

type RedisClientLike = {
  readonly connected: boolean;
  onclose: ((error: Error) => void) | null;
  connect(): Promise<void>;
  publish(channel: string, message: string): Promise<number>;
  subscribe(
    channel: string,
    listener: (message: string, channel: string) => void,
  ): Promise<number>;
};

type RedisClientConstructor = new (url: string) => RedisClientLike;

export type ChatRedisEvent =
  | {
      type: "chat:message";
      payload: ChatMessage;
    }
  | {
      type: "chat:dm";
      payload: ChatDirectMessage;
      recipient_user_ids: string[];
    };

const CHANNEL = "things:chat:events";
const redisUrl = process.env.REDIS_URL ?? process.env.VALKEY_URL ?? "";
const isBunRuntime = "Bun" in globalThis;

let publisher: RedisClientLike | null = null;
let subscriber: RedisClientLike | null = null;
let connectPromise: Promise<boolean> | null = null;
let subscribePromise: Promise<boolean> | null = null;
let subscribed = false;
let warned = false;

const warnOnce = (message: string, error?: unknown) => {
  if (warned) return;
  warned = true;
  if (error) {
    console.warn(message, error);
    return;
  }
  console.warn(message);
};

const loadRedisClientConstructor = async (): Promise<RedisClientConstructor | null> => {
  if (!isBunRuntime || !redisUrl) {
    return null;
  }

  try {
    const bunModuleName = "bun";
    const bunModule = (await import(bunModuleName)) as {
      RedisClient?: RedisClientConstructor;
    };
    return bunModule.RedisClient ?? null;
  } catch (error) {
    warnOnce("[chat-redis] failed to load Bun Redis client; using in-memory broadcast.", error);
    return null;
  }
};

const resetClients = () => {
  publisher = null;
  subscriber = null;
  connectPromise = null;
  subscribePromise = null;
  subscribed = false;
};

const connectRedisPair = async (): Promise<boolean> => {
  if (!redisUrl || !isBunRuntime) {
    return false;
  }

  const RedisClient = await loadRedisClientConstructor();
  if (!RedisClient) {
    return false;
  }

  try {
    const pub = new RedisClient(redisUrl);
    const sub = new RedisClient(redisUrl);
    await Promise.all([pub.connect(), sub.connect()]);

    pub.onclose = () => {
      resetClients();
    };
    sub.onclose = () => {
      resetClients();
    };

    publisher = pub;
    subscriber = sub;
    return true;
  } catch (error) {
    warnOnce("[chat-redis] failed to connect Redis; using in-memory broadcast.", error);
    resetClients();
    return false;
  }
};

const ensureConnected = async () => {
  if (publisher?.connected && subscriber?.connected) {
    return true;
  }

  if (!connectPromise) {
    connectPromise = connectRedisPair();
  }

  return connectPromise;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isParticipant = (value: unknown) => {
  if (!isObjectRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (typeof value.avatar === "string" || value.avatar === null) &&
    (typeof value.username === "string" || value.username === null)
  );
};

const isPublicMessage = (value: unknown): value is ChatMessage => {
  if (!isObjectRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    typeof value.created_at === "string" &&
    isParticipant(value.user)
  );
};

const isDirectMessage = (value: unknown): value is ChatDirectMessage => {
  if (!isObjectRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    typeof value.created_at === "string" &&
    isParticipant(value.sender) &&
    isParticipant(value.recipient)
  );
};

const parseChatRedisEvent = (raw: string): ChatRedisEvent | null => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isObjectRecord(parsed) || typeof parsed.type !== "string") {
      return null;
    }

    if (parsed.type === "chat:message") {
      if (!isPublicMessage(parsed.payload)) {
        return null;
      }
      return {
        type: "chat:message",
        payload: parsed.payload,
      };
    }

    if (parsed.type === "chat:dm") {
      if (!isDirectMessage(parsed.payload) || !Array.isArray(parsed.recipient_user_ids)) {
        return null;
      }
      const recipientUserIds = parsed.recipient_user_ids.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      );
      if (recipientUserIds.length === 0) {
        return null;
      }

      return {
        type: "chat:dm",
        payload: parsed.payload,
        recipient_user_ids: recipientUserIds,
      };
    }

    return null;
  } catch {
    return null;
  }
};

export const initChatRedisBridge = async (
  onEvent: (event: ChatRedisEvent) => void,
) => {
  if (subscribed) {
    return true;
  }

  if (!subscribePromise) {
    subscribePromise = (async () => {
      const ready = await ensureConnected();
      if (!ready || !subscriber) {
        return false;
      }

      try {
        await subscriber.subscribe(CHANNEL, (message) => {
          const event = parseChatRedisEvent(message);
          if (!event) return;
          onEvent(event);
        });
        subscribed = true;
        return true;
      } catch (error) {
        warnOnce("[chat-redis] failed to subscribe; using in-memory broadcast.", error);
        resetClients();
        return false;
      }
    })();
  }

  return subscribePromise;
};

export const isChatRedisBridgeReady = () => subscribed;

const publishEvent = async (event: ChatRedisEvent) => {
  const ready = await ensureConnected();
  if (!ready || !publisher) {
    return false;
  }

  try {
    await publisher.publish(CHANNEL, JSON.stringify(event));
    return true;
  } catch (error) {
    warnOnce("[chat-redis] failed to publish chat event; using in-memory broadcast.", error);
    return false;
  }
};

export const publishChatMessage = async (message: ChatMessage) =>
  publishEvent({
    type: "chat:message",
    payload: message,
  });

export const publishChatDirectMessage = async (
  message: ChatDirectMessage,
  recipientUserIds: string[],
) => {
  const uniqueRecipientUserIds = Array.from(
    new Set(
      recipientUserIds
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  );
  if (uniqueRecipientUserIds.length === 0) {
    return false;
  }

  return publishEvent({
    type: "chat:dm",
    payload: message,
    recipient_user_ids: uniqueRecipientUserIds,
  });
};
