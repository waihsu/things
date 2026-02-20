import { query } from "@/src/db/http";

export type StoryRow = {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  user_id: string;
  read_count: number;
  created_at: string;
  updated_at: string;
  category_ids: string[] | null;
  category_names: string[] | null;
  author_name: string | null;
  author_avatar: string | null;
  author_username: string | null;
  author_bio: string | null;
  author_urls: string | null;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  is_banned: boolean;
  banned_at: string | null;
  banned_reason: string | null;
};

type StoryStatsRow = {
  total_count: number;
};

export type StoryCommentRow = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
};

let ensureStoriesModerationPromise: Promise<void> | null = null;

const ensureStoriesModerationColumns = async () => {
  if (!ensureStoriesModerationPromise) {
    ensureStoriesModerationPromise = (async () => {
      await query(`
        ALTER TABLE short_stories
        ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false
      `);
      await query(`
        ALTER TABLE short_stories
        ADD COLUMN IF NOT EXISTS banned_at timestamp
      `);
      await query(`
        ALTER TABLE short_stories
        ADD COLUMN IF NOT EXISTS banned_reason text
      `);
      await query(`
        ALTER TABLE short_stories
        ADD COLUMN IF NOT EXISTS banned_by varchar(36)
      `);
    })().catch((error) => {
      ensureStoriesModerationPromise = null;
      throw error;
    });
  }

  await ensureStoriesModerationPromise;
};

export const storiesRepository = {
  async listIds(limit = 5000) {
    await ensureStoriesModerationColumns();
    const safeLimit = Math.max(1, Math.min(limit, 20_000));
    const result = await query<{ id: string }>(
      `SELECT id
       FROM short_stories
       WHERE COALESCE(is_banned, false) = false
       ORDER BY created_at DESC, id DESC
       LIMIT $1`,
      [safeLimit],
    );
    return result.rows.map((row) => row.id);
  },

  async listPage(input: {
    userId: string;
    cursorCreatedAt: string | null;
    cursorId: string | null;
    limit: number;
    includeBanned?: boolean;
  }) {
    await ensureStoriesModerationColumns();
    const result = await query<StoryRow>(
      `WITH base AS (
        SELECT
          s.id,
          s.title,
          s.summary,
          s.content,
          s.user_id,
          s.read_count,
          COALESCE(s.is_banned, false) AS is_banned,
          s.banned_at,
          s.banned_reason,
          s.created_at,
          s.updated_at
        FROM short_stories s
        WHERE (
          $2::timestamp IS NULL
          OR s.created_at < $2::timestamp
          OR (s.created_at = $2::timestamp AND s.id < COALESCE($3::varchar, ''))
        )
        AND ($5::boolean = true OR COALESCE(s.is_banned, false) = false)
        ORDER BY s.created_at DESC, s.id DESC
        LIMIT $4
      )
      SELECT
        s.id,
        s.title,
        s.summary,
        s.content,
        s.user_id,
        s.read_count,
        s.is_banned,
        s.banned_at,
        s.banned_reason,
        s.created_at,
        s.updated_at,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT c.id), NULL) AS category_ids,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT c.name), NULL) AS category_names,
        COALESCE(p.name, u.name) AS author_name,
        COALESCE(p.avatar_url, u.image) AS author_avatar,
        u.username AS author_username,
        p.bio AS author_bio,
        p.urls AS author_urls,
        COUNT(DISTINCT l.id)::int AS like_count,
        COUNT(DISTINCT cm.id)::int AS comment_count,
        COALESCE(BOOL_OR(l.user_id = $1), false) AS liked_by_me
      FROM base s
      LEFT JOIN story_categories sc ON sc.story_id = s.id
      LEFT JOIN categories c ON c.id = sc.category_id
      LEFT JOIN profiles p ON p.user_id = s.user_id
      LEFT JOIN "user" u ON u.id = s.user_id
      LEFT JOIN likes l ON l.story_id = s.id
      LEFT JOIN comments cm ON cm.story_id = s.id
      GROUP BY
        s.id,
        s.title,
        s.summary,
        s.content,
        s.user_id,
        s.read_count,
        s.is_banned,
        s.banned_at,
        s.banned_reason,
        s.created_at,
        s.updated_at,
        p.name,
        p.avatar_url,
        p.bio,
        p.urls,
        u.name,
        u.image,
        u.username
      ORDER BY s.created_at DESC, s.id DESC`,
      [input.userId, input.cursorCreatedAt, input.cursorId, input.limit, input.includeBanned ?? false],
    );
    return result.rows;
  },

  async readStats(includeBanned = false) {
    await ensureStoriesModerationColumns();
    const result = await query<StoryStatsRow>(
      `SELECT COUNT(*)::int AS total_count
       FROM short_stories
       WHERE ($1::boolean = true OR COALESCE(is_banned, false) = false)`,
      [includeBanned],
    );
    return result.rows[0] ?? { total_count: 0 };
  },

  async findById(id: string, userId: string, includeBanned = false) {
    await ensureStoriesModerationColumns();
    const result = await query<StoryRow>(
      `SELECT
        s.id,
        s.title,
        s.summary,
        s.content,
        s.user_id,
        s.read_count,
        COALESCE(s.is_banned, false) AS is_banned,
        s.banned_at,
        s.banned_reason,
        s.created_at,
        s.updated_at,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT c.id), NULL) AS category_ids,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT c.name), NULL) AS category_names,
        COALESCE(p.name, u.name) AS author_name,
        COALESCE(p.avatar_url, u.image) AS author_avatar,
        u.username AS author_username,
        p.bio AS author_bio,
        p.urls AS author_urls,
        COUNT(DISTINCT l.id)::int AS like_count,
        COUNT(DISTINCT cm.id)::int AS comment_count,
        COALESCE(BOOL_OR(l.user_id = $2), false) AS liked_by_me
      FROM short_stories s
      LEFT JOIN story_categories sc ON sc.story_id = s.id
      LEFT JOIN categories c ON c.id = sc.category_id
      LEFT JOIN profiles p ON p.user_id = s.user_id
      LEFT JOIN "user" u ON u.id = s.user_id
      LEFT JOIN likes l ON l.story_id = s.id
      LEFT JOIN comments cm ON cm.story_id = s.id
      WHERE s.id = $1
        AND ($3::boolean = true OR COALESCE(s.is_banned, false) = false)
      GROUP BY s.id, p.name, p.avatar_url, p.bio, p.urls, u.name, u.image, u.username`,
      [id, userId, includeBanned],
    );
    return result.rows[0] ?? null;
  },

  async listComments(storyId: string) {
    const result = await query<StoryCommentRow>(
      `SELECT
        cm.id,
        cm.user_id,
        cm.content,
        cm.created_at,
        p.name AS author_name,
        p.avatar_url AS author_avatar
      FROM comments cm
      LEFT JOIN profiles p ON p.user_id = cm.user_id
      WHERE cm.story_id = $1
      ORDER BY cm.created_at DESC`,
      [storyId],
    );

    return result.rows;
  },

  async createComment(input: { id: string; userId: string; storyId: string; content: string }) {
    await query(
      `INSERT INTO comments (id, user_id, story_id, content)
       VALUES ($1, $2, $3, $4)`,
      [input.id, input.userId, input.storyId, input.content],
    );
  },

  async deleteComment(input: { commentId: string; storyId: string; userId: string }) {
    return query(
      `DELETE FROM comments
       WHERE id = $1 AND story_id = $2 AND user_id = $3`,
      [input.commentId, input.storyId, input.userId],
    );
  },

  async findLike(storyId: string, userId: string) {
    const result = await query<{ id: string }>(
      `SELECT id FROM likes WHERE story_id = $1 AND user_id = $2`,
      [storyId, userId],
    );
    return result.rows[0] ?? null;
  },

  async deleteLike(id: string) {
    await query(`DELETE FROM likes WHERE id = $1`, [id]);
  },

  async createLike(storyId: string, userId: string) {
    await query(
      `INSERT INTO likes (id, user_id, story_id)
       VALUES ($1, $2, $3)`,
      [crypto.randomUUID(), userId, storyId],
    );
  },

  async countLikes(storyId: string) {
    const result = await query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM likes WHERE story_id = $1`,
      [storyId],
    );
    return result.rows[0]?.count ?? 0;
  },

  async incrementReadCount(storyId: string) {
    await ensureStoriesModerationColumns();
    const result = await query<{ read_count: number }>(
      `UPDATE short_stories
       SET read_count = read_count + 1
       WHERE id = $1 AND COALESCE(is_banned, false) = false
       RETURNING read_count`,
      [storyId],
    );
    return result.rows[0] ?? null;
  },

  async createStory(input: {
    id: string;
    title: string;
    summary: string | null;
    content: string;
    userId: string;
    categoryIds: string[];
  }) {
    await query(
      `INSERT INTO short_stories (id, title, summary, content, user_id, read_count)
       VALUES ($1, $2, $3, $4, $5, 0)`,
      [input.id, input.title, input.summary, input.content, input.userId],
    );

    await query(
      `INSERT INTO story_categories (story_id, category_id)
       SELECT $1, UNNEST($2::varchar[])`,
      [input.id, input.categoryIds],
    );
  },

  async updateStory(input: {
    id: string;
    userId: string;
    title: string;
    summary: string | null;
    content: string;
  }) {
    return query(
      `UPDATE short_stories
       SET title = $1,
           summary = $2,
           content = $3,
           updated_at = NOW()
       WHERE id = $4 AND user_id = $5`,
      [input.title, input.summary, input.content, input.id, input.userId],
    );
  },

  async replaceStoryCategories(storyId: string, categoryIds: string[]) {
    await query(`DELETE FROM story_categories WHERE story_id = $1`, [storyId]);
    await query(
      `INSERT INTO story_categories (story_id, category_id)
       SELECT $1, UNNEST($2::varchar[])`,
      [storyId, categoryIds],
    );
  },

  async deleteStory(storyId: string, userId: string) {
    return query(`DELETE FROM short_stories WHERE id = $1 AND user_id = $2`, [
      storyId,
      userId,
    ]);
  },

  async deleteStoryCategories(storyId: string) {
    await query(`DELETE FROM story_categories WHERE story_id = $1`, [storyId]);
  },

  async setBanStatus(input: {
    storyId: string;
    banned: boolean;
    reason: string | null;
    adminUserId: string;
  }) {
    await ensureStoriesModerationColumns();
    return query(
      `UPDATE short_stories
       SET
         is_banned = $2,
         banned_at = CASE WHEN $2 THEN NOW() ELSE NULL END,
         banned_reason = CASE WHEN $2 THEN $3 ELSE NULL END,
         banned_by = CASE WHEN $2 THEN $4 ELSE NULL END,
         updated_at = NOW()
       WHERE id = $1`,
      [input.storyId, input.banned, input.reason, input.adminUserId],
    );
  },
};
