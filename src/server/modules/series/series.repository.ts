import { query } from "@/src/db/http";

export type SeriesRow = {
  id: string;
  name: string;
  summary: string | null;
  user_id: string;
  read_count: number;
  created_at: string;
  updated_at: string;
  category_ids: string[] | null;
  category_names: string[] | null;
  episodes_count: number;
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

type SeriesStatsRow = {
  total_count: number;
};

export type SeriesCommentRow = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
};

const resolveReadCountSelect = (hasReadCount: boolean) =>
  hasReadCount ? "s.read_count" : "0::int AS read_count";

let ensureSeriesModerationPromise: Promise<void> | null = null;

const ensureSeriesModerationColumns = async () => {
  if (!ensureSeriesModerationPromise) {
    ensureSeriesModerationPromise = (async () => {
      await query(`
        ALTER TABLE series
        ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false
      `);
      await query(`
        ALTER TABLE series
        ADD COLUMN IF NOT EXISTS banned_at timestamp
      `);
      await query(`
        ALTER TABLE series
        ADD COLUMN IF NOT EXISTS banned_reason text
      `);
      await query(`
        ALTER TABLE series
        ADD COLUMN IF NOT EXISTS banned_by varchar(36)
      `);
    })().catch((error) => {
      ensureSeriesModerationPromise = null;
      throw error;
    });
  }

  await ensureSeriesModerationPromise;
};

export const seriesRepository = {
  async listIds(limit = 5000) {
    await ensureSeriesModerationColumns();
    const safeLimit = Math.max(1, Math.min(limit, 20_000));
    const result = await query<{ id: string }>(
      `SELECT id
       FROM series
       WHERE COALESCE(is_banned, false) = false
       ORDER BY created_at DESC, id DESC
       LIMIT $1`,
      [safeLimit],
    );
    return result.rows.map((row) => row.id);
  },

  async listPage(input: {
    userId: string;
    hasReadCount: boolean;
    cursorCreatedAt: string | null;
    cursorId: string | null;
    limit: number;
    includeBanned?: boolean;
  }) {
    await ensureSeriesModerationColumns();
    const readCountSelect = resolveReadCountSelect(input.hasReadCount);
    const result = await query<SeriesRow>(
      `WITH base AS (
        SELECT
          s.id,
          s.name,
          s.summary,
          s.user_id,
          ${readCountSelect},
          COALESCE(s.is_banned, false) AS is_banned,
          s.banned_at,
          s.banned_reason,
          s.created_at,
          s.updated_at
        FROM series s
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
        s.name,
        s.summary,
        s.user_id,
        s.read_count,
        s.is_banned,
        s.banned_at,
        s.banned_reason,
        s.created_at,
        s.updated_at,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT c.id), NULL) AS category_ids,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT c.name), NULL) AS category_names,
        COUNT(DISTINCT e.id)::int AS episodes_count,
        COALESCE(p.name, u.name) AS author_name,
        COALESCE(p.avatar_url, u.image) AS author_avatar,
        u.username AS author_username,
        p.bio AS author_bio,
        p.urls AS author_urls,
        COUNT(DISTINCT l.id)::int AS like_count,
        COUNT(DISTINCT cm.id)::int AS comment_count,
        COALESCE(BOOL_OR(l.user_id = $1), false) AS liked_by_me
      FROM base s
      LEFT JOIN series_categories sc ON sc.series_id = s.id
      LEFT JOIN categories c ON c.id = sc.category_id
      LEFT JOIN profiles p ON p.user_id = s.user_id
      LEFT JOIN "user" u ON u.id = s.user_id
      LEFT JOIN episodes e ON e.serie_id = s.id
      LEFT JOIN likes l ON l.series_id = s.id
      LEFT JOIN comments cm ON cm.series_id = s.id
      GROUP BY
        s.id,
        s.name,
        s.summary,
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
    await ensureSeriesModerationColumns();
    const result = await query<SeriesStatsRow>(
      `SELECT COUNT(*)::int AS total_count
       FROM series
       WHERE ($1::boolean = true OR COALESCE(is_banned, false) = false)`,
      [includeBanned],
    );
    return result.rows[0] ?? { total_count: 0 };
  },

  async findById(id: string, userId: string, hasReadCount: boolean, includeBanned = false) {
    await ensureSeriesModerationColumns();
    const readCountSelect = resolveReadCountSelect(hasReadCount);
    const result = await query<SeriesRow>(
      `SELECT
        s.id,
        s.name,
        s.summary,
        s.user_id,
        ${readCountSelect},
        COALESCE(s.is_banned, false) AS is_banned,
        s.banned_at,
        s.banned_reason,
        s.created_at,
        s.updated_at,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT c.id), NULL) AS category_ids,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT c.name), NULL) AS category_names,
        COUNT(DISTINCT e.id)::int AS episodes_count,
        COALESCE(p.name, u.name) AS author_name,
        COALESCE(p.avatar_url, u.image) AS author_avatar,
        u.username AS author_username,
        p.bio AS author_bio,
        p.urls AS author_urls,
        COUNT(DISTINCT l.id)::int AS like_count,
        COUNT(DISTINCT cm.id)::int AS comment_count,
        COALESCE(BOOL_OR(l.user_id = $2), false) AS liked_by_me
      FROM series s
      LEFT JOIN series_categories sc ON sc.series_id = s.id
      LEFT JOIN categories c ON c.id = sc.category_id
      LEFT JOIN profiles p ON p.user_id = s.user_id
      LEFT JOIN "user" u ON u.id = s.user_id
      LEFT JOIN episodes e ON e.serie_id = s.id
      LEFT JOIN likes l ON l.series_id = s.id
      LEFT JOIN comments cm ON cm.series_id = s.id
      WHERE s.id = $1
        AND ($3::boolean = true OR COALESCE(s.is_banned, false) = false)
      GROUP BY s.id, p.name, p.avatar_url, p.bio, p.urls, u.name, u.image, u.username`,
      [id, userId, includeBanned],
    );
    return result.rows[0] ?? null;
  },

  async listComments(seriesId: string) {
    const result = await query<SeriesCommentRow>(
      `SELECT
        cm.id,
        cm.user_id,
        cm.content,
        cm.created_at,
        p.name AS author_name,
        p.avatar_url AS author_avatar
      FROM comments cm
      LEFT JOIN profiles p ON p.user_id = cm.user_id
      WHERE cm.series_id = $1
      ORDER BY cm.created_at DESC`,
      [seriesId],
    );
    return result.rows;
  },

  async createComment(input: {
    id: string;
    userId: string;
    seriesId: string;
    content: string;
  }) {
    await query(
      `INSERT INTO comments (id, user_id, series_id, content)
       VALUES ($1, $2, $3, $4)`,
      [input.id, input.userId, input.seriesId, input.content],
    );
  },

  async deleteComment(input: { commentId: string; seriesId: string; userId: string }) {
    return query(
      `DELETE FROM comments
       WHERE id = $1 AND series_id = $2 AND user_id = $3`,
      [input.commentId, input.seriesId, input.userId],
    );
  },

  async findLike(seriesId: string, userId: string) {
    const result = await query<{ id: string }>(
      `SELECT id FROM likes WHERE series_id = $1 AND user_id = $2`,
      [seriesId, userId],
    );
    return result.rows[0] ?? null;
  },

  async deleteLike(id: string) {
    await query(`DELETE FROM likes WHERE id = $1`, [id]);
  },

  async createLike(seriesId: string, userId: string) {
    await query(
      `INSERT INTO likes (id, user_id, series_id)
       VALUES ($1, $2, $3)`,
      [crypto.randomUUID(), userId, seriesId],
    );
  },

  async countLikes(seriesId: string) {
    const result = await query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM likes WHERE series_id = $1`,
      [seriesId],
    );
    return result.rows[0]?.count ?? 0;
  },

  async incrementReadCount(seriesId: string) {
    await ensureSeriesModerationColumns();
    const result = await query<{ read_count: number }>(
      `UPDATE series
       SET read_count = read_count + 1
       WHERE id = $1 AND COALESCE(is_banned, false) = false
       RETURNING read_count`,
      [seriesId],
    );
    return result.rows[0] ?? null;
  },

  async createSeries(input: {
    id: string;
    name: string;
    summary: string | null;
    userId: string;
    categoryIds: string[];
  }) {
    await query(
      `INSERT INTO series (id, name, summary, user_id)
       VALUES ($1, $2, $3, $4)`,
      [input.id, input.name, input.summary, input.userId],
    );

    await query(
      `INSERT INTO series_categories (series_id, category_id)
       SELECT $1, UNNEST($2::varchar[])`,
      [input.id, input.categoryIds],
    );
  },

  async updateSeries(input: {
    id: string;
    userId: string;
    name: string;
    summary: string | null;
  }) {
    return query(
      `UPDATE series
       SET name = $1,
           summary = $2,
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4`,
      [input.name, input.summary, input.id, input.userId],
    );
  },

  async replaceSeriesCategories(seriesId: string, categoryIds: string[]) {
    await query(`DELETE FROM series_categories WHERE series_id = $1`, [seriesId]);
    await query(
      `INSERT INTO series_categories (series_id, category_id)
       SELECT $1, UNNEST($2::varchar[])`,
      [seriesId, categoryIds],
    );
  },

  async deleteSeries(seriesId: string, userId: string) {
    return query(`DELETE FROM series WHERE id = $1 AND user_id = $2`, [
      seriesId,
      userId,
    ]);
  },

  async deleteSeriesRelations(seriesId: string) {
    await query(`DELETE FROM episodes WHERE serie_id = $1`, [seriesId]);
    await query(`DELETE FROM series_categories WHERE series_id = $1`, [seriesId]);
  },

  async setBanStatus(input: {
    seriesId: string;
    banned: boolean;
    reason: string | null;
    adminUserId: string;
  }) {
    await ensureSeriesModerationColumns();
    return query(
      `UPDATE series
       SET
         is_banned = $2,
         banned_at = CASE WHEN $2 THEN NOW() ELSE NULL END,
         banned_reason = CASE WHEN $2 THEN $3 ELSE NULL END,
         banned_by = CASE WHEN $2 THEN $4 ELSE NULL END,
         updated_at = NOW()
       WHERE id = $1`,
      [input.seriesId, input.banned, input.reason, input.adminUserId],
    );
  },
};
