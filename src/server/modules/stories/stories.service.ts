import type { AppUser } from "@/src/server/types";
import {
  isNonEmptyString,
  normalizeOptionalString,
  normalizeStringArray,
} from "@/src/server/utils/validation";
import { randomFeedCache } from "@/src/server/lib/random-feed-cache";
import { ServiceError } from "@/src/server/utils/service-error";
import { isAdminUser, ensureAdminUser } from "@/src/server/utils/admin";
import { liveContentEvents } from "@/src/server/modules/live/live.events";
import { storiesRepository, type StoryRow } from "./stories.repository";

type StoryPayload = {
  title?: string;
  summary?: string;
  content?: string;
  category_ids?: string[];
};

type CommentPayload = {
  content?: string;
};

type ListStoriesInput = {
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

const withAuthor = (row: StoryRow) => ({
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

const validateStoryPayload = (payload: StoryPayload) => {
  if (!isNonEmptyString(payload.title) || !isNonEmptyString(payload.content)) {
    throw new ServiceError("Invalid payload", 400);
  }

  const categoryIds = normalizeStringArray(payload.category_ids);
  if (categoryIds.length === 0) {
    throw new ServiceError("Invalid payload", 400);
  }

  return {
    title: payload.title,
    content: payload.content,
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

const findStoriesByIds = async (ids: string[], userId: string) => {
  const rows = await Promise.all(ids.map((id) => storiesRepository.findById(id, userId)));
  return rows.filter((row): row is StoryRow => Boolean(row));
};

export const storiesService = {
  async list(user: AppUser | null, input: ListStoriesInput = {}) {
    const currentUser = ensureUser(user);
    const canModerate = isAdminUser(currentUser);
    const includeBanned = Boolean(input.includeBanned) && canModerate;
    const parsedLimit = Number(input.limit ?? 12);
    const limit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(30, Math.floor(parsedLimit)))
      : 12;
    const mode = input.mode?.toLowerCase() === "random" ? "random" : "latest";
    const stats = await storiesRepository.readStats(includeBanned);

    if (mode === "random") {
      const randomIds = await randomFeedCache.sampleIds("stories", limit, () =>
        storiesRepository.listIds(8000),
      );
      const items = await findStoriesByIds(randomIds, currentUser.id);

      return {
        stories: items.map(withAuthor),
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

      const rows = await storiesRepository.listPage({
        userId: currentUser.id,
        cursorCreatedAt,
        cursorId,
        limit: limit + 1,
        includeBanned,
      });

    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);
    const last = items[items.length - 1] ?? null;

    return {
      stories: items.map(withAuthor),
      next_cursor: hasMore && last ? encodeCursor(last.created_at, last.id) : null,
      has_more: hasMore,
      total_count: stats.total_count,
    };
  },

  async findOne(user: AppUser | null, storyId: string) {
    const currentUser = ensureUser(user);
    const canModerate = isAdminUser(currentUser);
    const story = await storiesRepository.findById(storyId, currentUser.id, canModerate);
    if (!story) {
      throw new ServiceError("Story not found", 404);
    }
    return withAuthor(story);
  },

  async listComments(storyId: string) {
    return storiesRepository.listComments(storyId);
  },

  async addComment(user: AppUser | null, storyId: string, payload: CommentPayload) {
    const currentUser = ensureUser(user);
    if (!isNonEmptyString(payload.content)) {
      throw new ServiceError("Invalid payload", 400);
    }

    const id = crypto.randomUUID();
    await storiesRepository.createComment({
      id,
      userId: currentUser.id,
      storyId,
      content: payload.content.trim(),
    });

    return { id };
  },

  async deleteComment(user: AppUser | null, storyId: string, commentId: string) {
    const currentUser = ensureUser(user);
    const result = await storiesRepository.deleteComment({
      commentId,
      storyId,
      userId: currentUser.id,
    });

    if (result.rowCount === 0) {
      throw new ServiceError("Comment not found", 404);
    }
  },

  async toggleLike(user: AppUser | null, storyId: string) {
    const currentUser = ensureUser(user);
    let liked = false;

    const existing = await storiesRepository.findLike(storyId, currentUser.id);
    if (existing) {
      await storiesRepository.deleteLike(existing.id);
      liked = false;
    } else {
      await storiesRepository.createLike(storyId, currentUser.id);
      liked = true;
    }

    const likeCount = await storiesRepository.countLikes(storyId);
    return { liked, like_count: likeCount };
  },

  async incrementRead(user: AppUser | null, storyId: string) {
    ensureUser(user);
    const updated = await storiesRepository.incrementReadCount(storyId);
    if (!updated) {
      throw new ServiceError("Story not found", 404);
    }
    return { read_count: updated.read_count };
  },

  async create(user: AppUser | null, payload: StoryPayload) {
    const currentUser = ensureUser(user);
    const parsed = validateStoryPayload(payload);
    const id = crypto.randomUUID();

    await storiesRepository.createStory({
      id,
      title: parsed.title,
      summary: parsed.summary,
      content: parsed.content,
      userId: currentUser.id,
      categoryIds: parsed.categoryIds,
    });
    await randomFeedCache.add("stories", id);
    liveContentEvents.emit({
      kind: "story",
      action: "created",
      id,
      at: new Date().toISOString(),
    });

    return { id };
  },

  async update(user: AppUser | null, storyId: string, payload: StoryPayload) {
    const currentUser = ensureUser(user);
    const parsed = validateStoryPayload(payload);

    const result = await storiesRepository.updateStory({
      id: storyId,
      userId: currentUser.id,
      title: parsed.title,
      summary: parsed.summary,
      content: parsed.content,
    });

    if (result.rowCount === 0) {
      throw new ServiceError("Story not found", 404);
    }

    await storiesRepository.replaceStoryCategories(storyId, parsed.categoryIds);
    liveContentEvents.emit({
      kind: "story",
      action: "updated",
      id: storyId,
      at: new Date().toISOString(),
    });
  },

  async remove(user: AppUser | null, storyId: string) {
    const currentUser = ensureUser(user);
    await storiesRepository.deleteStoryCategories(storyId);
    const result = await storiesRepository.deleteStory(storyId, currentUser.id);
    if (result.rowCount === 0) {
      throw new ServiceError("Story not found", 404);
    }
    await randomFeedCache.remove("stories", storyId);
    liveContentEvents.emit({
      kind: "story",
      action: "deleted",
      id: storyId,
      at: new Date().toISOString(),
    });
  },

  async ban(user: AppUser | null, storyId: string, reason?: string) {
    const admin = ensureAdminUser(user);
    const banReason = normalizeOptionalString(reason);

    const result = await storiesRepository.setBanStatus({
      storyId,
      banned: true,
      reason: banReason,
      adminUserId: admin.id,
    });

    if (result.rowCount === 0) {
      throw new ServiceError("Story not found", 404);
    }

    await randomFeedCache.remove("stories", storyId);
    liveContentEvents.emit({
      kind: "story",
      action: "banned",
      id: storyId,
      at: new Date().toISOString(),
    });
  },

  async unban(user: AppUser | null, storyId: string) {
    ensureAdminUser(user);
    const result = await storiesRepository.setBanStatus({
      storyId,
      banned: false,
      reason: null,
      adminUserId: "",
    });

    if (result.rowCount === 0) {
      throw new ServiceError("Story not found", 404);
    }

    await randomFeedCache.add("stories", storyId);
    liveContentEvents.emit({
      kind: "story",
      action: "unbanned",
      id: storyId,
      at: new Date().toISOString(),
    });
  },
};
