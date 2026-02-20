export type LiveContentKind = "story" | "poem" | "series";

export type LiveContentAction =
  | "created"
  | "updated"
  | "deleted"
  | "banned"
  | "unbanned";

export type LiveContentEventPayload = {
  kind: LiveContentKind;
  action: LiveContentAction;
  id: string;
  at: string;
};

type LiveContentEventListener = (payload: LiveContentEventPayload) => void;

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

const CHANNEL = "things:live:content";
const redisUrl = process.env.REDIS_URL ?? process.env.VALKEY_URL ?? "";
const isBunRuntime = "Bun" in globalThis;

class LiveContentEvents {
  private listeners = new Set<LiveContentEventListener>();
  private publisher: RedisClientLike | null = null;
  private subscriber: RedisClientLike | null = null;
  private connectPromise: Promise<boolean> | null = null;
  private subscribePromise: Promise<boolean> | null = null;
  private subscribed = false;
  private warned = false;
  private instanceId: string | null = null;

  private getInstanceId() {
    if (!this.instanceId) {
      this.instanceId = crypto.randomUUID();
    }
    return this.instanceId;
  }

  private warnOnce(message: string, error?: unknown) {
    if (this.warned) return;
    this.warned = true;
    if (error) {
      console.warn(message, error);
      return;
    }
    console.warn(message);
  }

  private resetRedisClients() {
    this.publisher = null;
    this.subscriber = null;
    this.connectPromise = null;
    this.subscribePromise = null;
    this.subscribed = false;
  }

  private async loadRedisClientConstructor(): Promise<RedisClientConstructor | null> {
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
      this.warnOnce(
        "[live] failed to load Bun Redis client; realtime stays process-local.",
        error,
      );
      return null;
    }
  }

  private isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  private parsePayload(raw: string): LiveContentEventPayload | null {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!this.isObjectRecord(parsed)) {
        return null;
      }

      const source = parsed.source;
      const payload = parsed.payload;

      if (typeof source !== "string" || !this.isObjectRecord(payload)) {
        return null;
      }

      if (source === this.getInstanceId()) {
        return null;
      }

      const kind = payload.kind;
      const action = payload.action;
      const id = payload.id;
      const at = payload.at;

      if (
        (kind !== "story" && kind !== "poem" && kind !== "series") ||
        (action !== "created" &&
          action !== "updated" &&
          action !== "deleted" &&
          action !== "banned" &&
          action !== "unbanned") ||
        typeof id !== "string" ||
        typeof at !== "string"
      ) {
        return null;
      }

      return payload as LiveContentEventPayload;
    } catch {
      return null;
    }
  }

  private dispatch(payload: LiveContentEventPayload) {
    for (const listener of this.listeners) {
      listener(payload);
    }
  }

  private async connectRedisPair() {
    if (!redisUrl || !isBunRuntime) {
      return false;
    }

    const RedisClient = await this.loadRedisClientConstructor();
    if (!RedisClient) {
      return false;
    }

    try {
      const pub = new RedisClient(redisUrl);
      const sub = new RedisClient(redisUrl);
      await Promise.all([pub.connect(), sub.connect()]);

      pub.onclose = () => {
        this.resetRedisClients();
      };
      sub.onclose = () => {
        this.resetRedisClients();
      };

      this.publisher = pub;
      this.subscriber = sub;
      return true;
    } catch (error) {
      this.warnOnce("[live] failed to connect Redis; realtime stays process-local.", error);
      this.resetRedisClients();
      return false;
    }
  }

  private async ensureConnected() {
    if (this.publisher?.connected && this.subscriber?.connected) {
      return true;
    }

    if (!this.connectPromise) {
      this.connectPromise = this.connectRedisPair();
    }

    return this.connectPromise;
  }

  private async ensureSubscribed() {
    if (this.subscribed) {
      return true;
    }

    if (!this.subscribePromise) {
      this.subscribePromise = (async () => {
        const ready = await this.ensureConnected();
        if (!ready || !this.subscriber) {
          return false;
        }

        try {
          await this.subscriber.subscribe(CHANNEL, (message) => {
            const parsed = this.parsePayload(message);
            if (!parsed) return;
            this.dispatch(parsed);
          });
          this.subscribed = true;
          return true;
        } catch (error) {
          this.warnOnce(
            "[live] failed to subscribe Redis; realtime stays process-local.",
            error,
          );
          this.resetRedisClients();
          return false;
        }
      })();
    }

    return this.subscribePromise;
  }

  private async publish(payload: LiveContentEventPayload) {
    const ready = await this.ensureConnected();
    if (!ready || !this.publisher) {
      return;
    }

    try {
      await this.publisher.publish(
        CHANNEL,
        JSON.stringify({
          source: this.getInstanceId(),
          payload,
        }),
      );
    } catch (error) {
      this.warnOnce("[live] failed to publish realtime event to Redis.", error);
    }
  }

  subscribe(listener: LiveContentEventListener) {
    void this.ensureSubscribed();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(payload: LiveContentEventPayload) {
    this.dispatch(payload);
    void this.publish(payload);
  }
}

export const liveContentEvents = new LiveContentEvents();
