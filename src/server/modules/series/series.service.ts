import type { AppUser } from "@/src/server/types";
import { hasColumn } from "@/src/server/utils/column-cache";
import {
  isNonEmptyString,
  normalizeOptionalString,
  normalizeStringArray,
} from "@/src/server/utils/validation";
import { randomFeedCache } from "@/src/server/lib/random-feed-cache";
import { ServiceError } from "@/src/server/utils/service-error";
import { ensureAdminUser, isAdminUser } from "@/src/server/utils/admin";
import { liveContentEvents } from "@/src/server/modules/live/live.events";
import { seriesRepository, type SeriesRow } from "./series.repository";

type SeriesPayload = {
  name?: string;
  summary?: string;
  category_ids?: string[];
};

type CommentPayload = {
  content?: string;
};

type ListSeriesInput = {
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

const withAuthor = (row: SeriesRow) => ({
  ...row,
  author: {
    id: row.user_id,
    name: row.author_name,
    avatar: row.author_avatar,
    username: row.author_username,
    bio: row.author_bio,
    urls: row.author_urls,
  },
});

const validatePayload = (payload: SeriesPayload) => {
  if (!isNonEmptyString(payload.name)) {
    throw new ServiceError("Invalid payload", 400);
  }

  const categoryIds = normalizeStringArray(payload.category_ids);
  if (categoryIds.length === 0) {
    throw new ServiceError("Invalid payload", 400);
  }

  return {
    name: payload.name,
    summary: normalizeOptionalString(payload.summary),
    categoryIds,
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

const findSeriesByIds = async (ids: string[], userId: string, hasReadCount: boolean) => {
  const rows = await Promise.all(
    ids.map((id) => seriesRepository.findById(id, userId, hasReadCount, false)),
  );
  return rows.filter((row): row is SeriesRow => Boolean(row));
};

export const seriesService = {
  async list(user: AppUser | null, input: ListSeriesInput = {}) {
    const currentUser = ensureUser(user);
    const canModerate = isAdminUser(currentUser);
    const includeBanned = Boolean(input.includeBanned) && canModerate;
    const hasReadCount = await hasColumn("series", "read_count");

    const parsedLimit = Number(input.limit ?? 9);
    const limit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(30, Math.floor(parsedLimit)))
      : 9;
    const mode = input.mode?.toLowerCase() === "random" ? "random" : "latest";
    const stats = await seriesRepository.readStats(includeBanned);

    if (mode === "random") {
      const randomIds = await randomFeedCache.sampleIds("series", limit, () =>
        seriesRepository.listIds(8000),
      );
      const items = await findSeriesByIds(randomIds, currentUser.id, hasReadCount);

      return {
        series: items.map(withAuthor),
        next_cursor: null,
        has_more: false,
        total_count: stats.total_count,
      };
    }

    let cursorCreatedAt: string | null = null;
    let cursorId: string | null = null;
    if (input.cursor) {
      const decoded = decodeCursor(input.cursor);
      cursorCreatedAt = decoded.createdAt;
      cursorId = decoded.id;
    }

    const rows = await seriesRepository.listPage({
      userId: currentUser.id,
      hasReadCount,
      cursorCreatedAt,
      cursorId,
      limit: limit + 1,
      includeBanned,
    });

    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);
    const last = items[items.length - 1] ?? null;

    return {
      series: items.map(withAuthor),
      next_cursor: hasMore && last ? encodeCursor(last.created_at, last.id) : null,
      has_more: hasMore,
      total_count: stats.total_count,
    };
  },

  async findOne(user: AppUser | null, seriesId: string) {
    const currentUser = ensureUser(user);
    const hasReadCount = await hasColumn("series", "read_count");
    const canModerate = isAdminUser(currentUser);
    const row = await seriesRepository.findById(
      seriesId,
      currentUser.id,
      hasReadCount,
      canModerate,
    );
    if (!row) {
      throw new ServiceError("Series not found", 404);
    }
    return withAuthor(row);
  },

  async listComments(seriesId: string) {
    return seriesRepository.listComments(seriesId);
  },

  async addComment(user: AppUser | null, seriesId: string, payload: CommentPayload) {
    const currentUser = ensureUser(user);
    if (!isNonEmptyString(payload.content)) {
      throw new ServiceError("Invalid payload", 400);
    }
    const id = crypto.randomUUID();
    await seriesRepository.createComment({
      id,
      userId: currentUser.id,
      seriesId,
      content: payload.content.trim(),
    });
    return { id };
  },

  async deleteComment(user: AppUser | null, seriesId: string, commentId: string) {
    const currentUser = ensureUser(user);
    const result = await seriesRepository.deleteComment({
      commentId,
      seriesId,
      userId: currentUser.id,
    });
    if (result.rowCount === 0) {
      throw new ServiceError("Comment not found", 404);
    }
  },

  async toggleLike(user: AppUser | null, seriesId: string) {
    const currentUser = ensureUser(user);
    let liked = false;
    const existing = await seriesRepository.findLike(seriesId, currentUser.id);
    if (existing) {
      await seriesRepository.deleteLike(existing.id);
      liked = false;
    } else {
      await seriesRepository.createLike(seriesId, currentUser.id);
      liked = true;
    }

    const likeCount = await seriesRepository.countLikes(seriesId);
    return { liked, like_count: likeCount };
  },

  async incrementRead(user: AppUser | null, seriesId: string) {
    ensureUser(user);
    const hasReadCount = await hasColumn("series", "read_count");
    if (!hasReadCount) {
      return { read_count: 0 };
    }
    const updated = await seriesRepository.incrementReadCount(seriesId);
    if (!updated) {
      throw new ServiceError("Series not found", 404);
    }
    return { read_count: updated.read_count };
  },

  async create(user: AppUser | null, payload: SeriesPayload) {
    const currentUser = ensureUser(user);
    const parsed = validatePayload(payload);
    const id = crypto.randomUUID();
    await seriesRepository.createSeries({
      id,
      name: parsed.name,
      summary: parsed.summary,
      userId: currentUser.id,
      categoryIds: parsed.categoryIds,
    });
    await randomFeedCache.add("series", id);
    liveContentEvents.emit({
      kind: "series",
      action: "created",
      id,
      at: new Date().toISOString(),
    });
    return { id };
  },

  async update(user: AppUser | null, seriesId: string, payload: SeriesPayload) {
    const currentUser = ensureUser(user);
    const parsed = validatePayload(payload);

    const result = await seriesRepository.updateSeries({
      id: seriesId,
      userId: currentUser.id,
      name: parsed.name,
      summary: parsed.summary,
    });

    if (result.rowCount === 0) {
      throw new ServiceError("Series not found", 404);
    }

    await seriesRepository.replaceSeriesCategories(seriesId, parsed.categoryIds);
    liveContentEvents.emit({
      kind: "series",
      action: "updated",
      id: seriesId,
      at: new Date().toISOString(),
    });
  },

  async remove(user: AppUser | null, seriesId: string) {
    const currentUser = ensureUser(user);
    await seriesRepository.deleteSeriesRelations(seriesId);
    const result = await seriesRepository.deleteSeries(seriesId, currentUser.id);
    if (result.rowCount === 0) {
      throw new ServiceError("Series not found", 404);
    }
    await randomFeedCache.remove("series", seriesId);
    liveContentEvents.emit({
      kind: "series",
      action: "deleted",
      id: seriesId,
      at: new Date().toISOString(),
    });
  },

  async ban(user: AppUser | null, seriesId: string, reason?: string) {
    const admin = ensureAdminUser(user);
    const banReason = normalizeOptionalString(reason);
    const result = await seriesRepository.setBanStatus({
      seriesId,
      banned: true,
      reason: banReason,
      adminUserId: admin.id,
    });
    if (result.rowCount === 0) {
      throw new ServiceError("Series not found", 404);
    }
    await randomFeedCache.remove("series", seriesId);
    liveContentEvents.emit({
      kind: "series",
      action: "banned",
      id: seriesId,
      at: new Date().toISOString(),
    });
  },

  async unban(user: AppUser | null, seriesId: string) {
    ensureAdminUser(user);
    const result = await seriesRepository.setBanStatus({
      seriesId,
      banned: false,
      reason: null,
      adminUserId: "",
    });
    if (result.rowCount === 0) {
      throw new ServiceError("Series not found", 404);
    }
    await randomFeedCache.add("series", seriesId);
    liveContentEvents.emit({
      kind: "series",
      action: "unbanned",
      id: seriesId,
      at: new Date().toISOString(),
    });
  },
};
