type RedisClientLike = {
  readonly connected: boolean;
  onclose: ((error: Error) => void) | null;
  connect(): Promise<void>;
  srandmember(key: string, count: number): Promise<string[]>;
  del(...keys: string[]): Promise<number>;
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
};

type RedisClientConstructor = new (url: string) => RedisClientLike;

let cachedClient: RedisClientLike | null = null;
let connectPromise: Promise<RedisClientLike | null> | null = null;
let redisClientConstructorPromise: Promise<RedisClientConstructor | null> | null = null;
let warnedUnavailable = false;

const redisUrl = process.env.REDIS_URL ?? process.env.VALKEY_URL ?? "";
const isBunRuntime = "Bun" in globalThis;

const warnOnce = (message: string, error?: unknown) => {
  if (warnedUnavailable) return;
  warnedUnavailable = true;
  if (error) {
    console.warn(message, error);
    return;
  }
  console.warn(message);
};

const loadRedisClientConstructor = async (): Promise<RedisClientConstructor | null> => {
  if (!isBunRuntime) {
    return null;
  }

  if (!redisClientConstructorPromise) {
    redisClientConstructorPromise = (async () => {
      try {
        // Keep module name non-literal so worker bundlers don't try to resolve it.
        const bunModuleName = "bun";
        const bunModule = (await import(bunModuleName)) as {
          RedisClient?: RedisClientConstructor;
        };
        if (!bunModule.RedisClient) {
          warnOnce("[redis] Bun Redis client is unavailable. Falling back to DB-only mode.");
          return null;
        }
        return bunModule.RedisClient;
      } catch (error) {
        warnOnce("[redis] Bun Redis client load failed. Falling back to DB-only mode.", error);
        return null;
      }
    })();
  }

  return redisClientConstructorPromise;
};

const connectRedis = async () => {
  if (!redisUrl) {
    return null;
  }

  const RedisClient = await loadRedisClientConstructor();
  if (!RedisClient) {
    return null;
  }

  try {
    const client = new RedisClient(redisUrl);
    await client.connect();
    client.onclose = () => {
      cachedClient = null;
      connectPromise = null;
    };
    return client;
  } catch (error) {
    warnOnce("[redis] failed to connect. Falling back to DB-only mode.", error);
    return null;
  }
};

export const redisClient = {
  async get() {
    if (!redisUrl) {
      return null;
    }

    if (cachedClient?.connected) {
      return cachedClient;
    }

    if (!connectPromise) {
      connectPromise = connectRedis().then((client) => {
        cachedClient = client;
        return client;
      });
    }

    return connectPromise;
  },

  async run<T>(operation: (client: RedisClientLike) => Promise<T>, fallback: T): Promise<T> {
    const client = await this.get();
    if (!client) {
      return fallback;
    }

    try {
      return await operation(client);
    } catch (error) {
      warnOnce("[redis] command failed. Falling back to DB-only mode.", error);
      return fallback;
    }
  },
};
