import { redisClient } from "./redis-client";

type FeedKind = "poems" | "stories" | "series";

const FEED_KEY_PREFIX = "feed:random";
const CHUNK_SIZE = 500;

const keyFor = (kind: FeedKind) => `${FEED_KEY_PREFIX}:${kind}:ids`;

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const uniqueNonEmpty = (ids: string[]) =>
  Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));

const sampleLocal = (ids: string[], limit: number) => {
  const pool = [...ids];
  const result: string[] = [];

  while (pool.length > 0 && result.length < limit) {
    const index = Math.floor(Math.random() * pool.length);
    result.push(pool[index]!);
    pool.splice(index, 1);
  }

  return result;
};

export const randomFeedCache = {
  async sampleIds(kind: FeedKind, limit: number, hydrate: () => Promise<string[]>) {
    const key = keyFor(kind);
    const target = Math.max(1, Math.min(60, limit));

    const cached = await redisClient.run<string[] | null>(
      (client) => client.srandmember(key, target),
      null,
    );
    const cachedIds = uniqueNonEmpty(cached ?? []);

    if (cachedIds.length >= Math.min(target, 3)) {
      return cachedIds.slice(0, target);
    }

    const hydratedIds = uniqueNonEmpty(await hydrate());
    if (!hydratedIds.length) {
      return [];
    }

    await this.replaceAll(kind, hydratedIds);
    return sampleLocal(hydratedIds, target);
  },

  async replaceAll(kind: FeedKind, ids: string[]) {
    const key = keyFor(kind);
    const uniqueIds = uniqueNonEmpty(ids);

    await redisClient.run(
      async (client) => {
        await client.del(key);
        if (!uniqueIds.length) {
          return;
        }

        for (const idsChunk of chunk(uniqueIds, CHUNK_SIZE)) {
          await client.sadd(key, ...idsChunk);
        }
      },
      undefined,
    );
  },

  async add(kind: FeedKind, id: string) {
    const key = keyFor(kind);
    const normalizedId = id.trim();
    if (!normalizedId) return;

    await redisClient.run(
      (client) => client.sadd(key, normalizedId).then(() => undefined),
      undefined,
    );
  },

  async remove(kind: FeedKind, id: string) {
    const key = keyFor(kind);
    const normalizedId = id.trim();
    if (!normalizedId) return;

    await redisClient.run(
      (client) => client.srem(key, normalizedId).then(() => undefined),
      undefined,
    );
  },
};
