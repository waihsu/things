import type { AppUser } from "@/src/server/types";
import { ServiceError } from "@/src/server/utils/service-error";
import {
  isNonEmptyString,
  normalizeOptionalString,
  normalizeStringArray,
} from "@/src/server/utils/validation";
import { randomFeedCache } from "@/src/server/lib/random-feed-cache";
import { poemsEvents } from "./poems.events";
import { ensureAdminUser, isAdminUser } from "@/src/server/utils/admin";
import { liveContentEvents } from "@/src/server/modules/live/live.events";
import { poemsRepository, type PoemRow } from "./poems.repository";

type PoemPayload = {
  title?: string;
  summary?: string;
  content?: string;
  category_ids?: string[];
  tags?: string[];
};

type ListPoemsInput = {
  cursor?: string;
  limit?: number;
  mode?: string;
  includeBanned?: boolean;
};

const ensureUser = (user: AppUser | null): AppUser => {
  if (!user) {
    throw new ServiceError("Unauthorized", 401);
  }
  return user;
};

const toPoem = (poem: PoemRow) => ({
  ...poem,
  category_ids: poem.category_ids ?? [],
  category_names: poem.category_names ?? [],
  tags: poem.tags ?? [],
  author: {
    id: poem.user_id,
    name: poem.author_name,
    avatar: poem.author_avatar,
    bio: poem.author_bio,
    urls: poem.author_urls,
  },
});

const validatePayload = (payload: PoemPayload) => {
  if (!isNonEmptyString(payload.title) || !isNonEmptyString(payload.content)) {
    throw new ServiceError("Invalid payload", 400);
  }

  const categoryIds = Array.from(new Set(normalizeStringArray(payload.category_ids))).slice(
    0,
    10,
  );
  const tags = Array.from(
    new Set(
      normalizeStringArray(payload.tags)
        .map((item) => item.toLowerCase())
        .filter((item) => item.length <= 60),
    ),
  ).slice(0, 15);

  return {
    title: payload.title,
    summary: normalizeOptionalString(payload.summary),
    content: payload.content,
    categoryIds,
    tags,
  };
};

const encodeCursor = (createdAt: string, id: string) =>
  Buffer.from(`${createdAt}|${id}`).toString("base64url");

const decodeCursor = (cursor: string) => {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const [createdAt, id] = decoded.split("|");
    if (!createdAt || !id) {
      throw new Error("invalid");
    }
    return { createdAt, id };
  } catch {
    throw new ServiceError("Invalid cursor", 400);
  }
};

const findPoemsByIds = async (ids: string[], includeBanned = false) => {
  const rows = await Promise.all(ids.map((id) => poemsRepository.findById(id, includeBanned)));
  return rows.filter((row): row is PoemRow => Boolean(row));
};

export const poemsService = {
  async list(user: AppUser | null, input: ListPoemsInput = {}) {
    const currentUser = ensureUser(user);
    const canModerate = isAdminUser(currentUser);
    const includeBanned = Boolean(input.includeBanned) && canModerate;
    const parsedLimit = Number(input.limit ?? 12);
    const limit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(30, Math.floor(parsedLimit)))
      : 12;
    const mode = input.mode?.toLowerCase() === "random" ? "random" : "latest";
    const stats = await poemsRepository.readStats(includeBanned);

    if (mode === "random") {
      const randomIds = await randomFeedCache.sampleIds("poems", limit, () =>
        poemsRepository.listIds(8000),
      );
      const items = await findPoemsByIds(randomIds, includeBanned);

      return {
        poems: items.map(toPoem),
        next_cursor: null,
        has_more: false,
        total_count: stats.total_count,
        total_reads: stats.total_reads,
      };
    }

    let cursorCreatedAt: string | null = null;
    let cursorId: string | null = null;
    if (input.cursor) {
      const decoded = decodeCursor(input.cursor);
      cursorCreatedAt = decoded.createdAt;
      cursorId = decoded.id;
    }

    const rows = await poemsRepository.listPage({
      cursorCreatedAt,
      cursorId,
      limit: limit + 1,
      includeBanned,
    });

    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);
    const last = items[items.length - 1] ?? null;

    return {
      poems: items.map(toPoem),
      next_cursor: hasMore && last ? encodeCursor(last.created_at, last.id) : null,
      has_more: hasMore,
      total_count: stats.total_count,
      total_reads: stats.total_reads,
    };
  },

  async findOne(user: AppUser | null, id: string) {
    const currentUser = ensureUser(user);
    const canModerate = isAdminUser(currentUser);
    const poem = await poemsRepository.findById(id, canModerate);
    if (!poem) {
      throw new ServiceError("Poem not found", 404);
    }
    return toPoem(poem);
  },

  async create(user: AppUser | null, payload: PoemPayload) {
    const currentUser = ensureUser(user);
    const parsed = validatePayload(payload);
    const id = crypto.randomUUID();
    await poemsRepository.create({
      id,
      title: parsed.title,
      summary: parsed.summary,
      content: parsed.content,
      userId: currentUser.id,
      categoryIds: parsed.categoryIds,
      tags: parsed.tags,
    });
    await randomFeedCache.add("poems", id);
    poemsEvents.emit({ type: "created", poem_id: id, at: new Date().toISOString() });
    liveContentEvents.emit({
      kind: "poem",
      action: "created",
      id,
      at: new Date().toISOString(),
    });
    return { id };
  },

  async update(user: AppUser | null, id: string, payload: PoemPayload) {
    const currentUser = ensureUser(user);
    const parsed = validatePayload(payload);
    const result = await poemsRepository.update({
      id,
      userId: currentUser.id,
      title: parsed.title,
      summary: parsed.summary,
      content: parsed.content,
      categoryIds: parsed.categoryIds,
      tags: parsed.tags,
    });
    if (result.rowCount === 0) {
      throw new ServiceError("Poem not found", 404);
    }
    poemsEvents.emit({ type: "updated", poem_id: id, at: new Date().toISOString() });
    liveContentEvents.emit({
      kind: "poem",
      action: "updated",
      id,
      at: new Date().toISOString(),
    });
  },

  async remove(user: AppUser | null, id: string) {
    const currentUser = ensureUser(user);
    const result = await poemsRepository.remove(id, currentUser.id);
    if (result.rowCount === 0) {
      throw new ServiceError("Poem not found", 404);
    }
    await randomFeedCache.remove("poems", id);
    poemsEvents.emit({ type: "deleted", poem_id: id, at: new Date().toISOString() });
    liveContentEvents.emit({
      kind: "poem",
      action: "deleted",
      id,
      at: new Date().toISOString(),
    });
  },

  async incrementRead(user: AppUser | null, id: string) {
    ensureUser(user);
    const updated = await poemsRepository.incrementRead(id);
    if (!updated) {
      throw new ServiceError("Poem not found", 404);
    }
    return { read_count: updated.read_count };
  },

  async ban(user: AppUser | null, poemId: string, reason?: string) {
    const admin = ensureAdminUser(user);
    const banReason = normalizeOptionalString(reason);
    const result = await poemsRepository.setBanStatus({
      poemId,
      banned: true,
      reason: banReason,
      adminUserId: admin.id,
    });
    if (result.rowCount === 0) {
      throw new ServiceError("Poem not found", 404);
    }
    await randomFeedCache.remove("poems", poemId);
    liveContentEvents.emit({
      kind: "poem",
      action: "banned",
      id: poemId,
      at: new Date().toISOString(),
    });
  },

  async unban(user: AppUser | null, poemId: string) {
    ensureAdminUser(user);
    const result = await poemsRepository.setBanStatus({
      poemId,
      banned: false,
      reason: null,
      adminUserId: "",
    });
    if (result.rowCount === 0) {
      throw new ServiceError("Poem not found", 404);
    }
    await randomFeedCache.add("poems", poemId);
    liveContentEvents.emit({
      kind: "poem",
      action: "unbanned",
      id: poemId,
      at: new Date().toISOString(),
    });
  },
};
