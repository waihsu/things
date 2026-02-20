import { query } from "@/src/db/http";

export type PoemRow = {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  user_id: string;
  read_count: number;
  created_at: string;
  updated_at: string;
  author_name: string | null;
  author_avatar: string | null;
  author_username: string | null;
  author_bio: string | null;
  author_urls: string | null;
  category_ids: string[] | null;
  category_names: string[] | null;
  tags: string[] | null;
  is_banned: boolean;
  banned_at: string | null;
  banned_reason: string | null;
};

type PoemStatsRow = {
  total_count: number;
  total_reads: number;
};

let ensurePoemsMetadataPromise: Promise<void> | null = null;

const ensurePoemsMetadata = async () => {
  if (!ensurePoemsMetadataPromise) {
    ensurePoemsMetadataPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS poem_categories (
          poem_id varchar(36) NOT NULL REFERENCES poems(id) ON DELETE CASCADE,
          category_id varchar(36) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          PRIMARY KEY (poem_id, category_id)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS poem_tags (
          poem_id varchar(36) NOT NULL REFERENCES poems(id) ON DELETE CASCADE,
          tag varchar(60) NOT NULL,
          PRIMARY KEY (poem_id, tag)
        )
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS poem_tags_tag_idx
        ON poem_tags (tag)
      `);

      await query(`
        ALTER TABLE poems
        ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false
      `);
      await query(`
        ALTER TABLE poems
        ADD COLUMN IF NOT EXISTS banned_at timestamp
      `);
      await query(`
        ALTER TABLE poems
        ADD COLUMN IF NOT EXISTS banned_reason text
      `);
      await query(`
        ALTER TABLE poems
        ADD COLUMN IF NOT EXISTS banned_by varchar(36)
      `);
    })().catch((error) => {
      ensurePoemsMetadataPromise = null;
      throw error;
    });
  }

  await ensurePoemsMetadataPromise;
};

const replacePoemCategories = async (poemId: string, categoryIds: string[]) => {
  await query(`DELETE FROM poem_categories WHERE poem_id = $1`, [poemId]);
  if (!categoryIds.length) {
    return;
  }

  await query(
    `INSERT INTO poem_categories (poem_id, category_id)
     SELECT $1, UNNEST($2::varchar[])
     ON CONFLICT DO NOTHING`,
    [poemId, categoryIds],
  );
};

const replacePoemTags = async (poemId: string, tags: string[]) => {
  await query(`DELETE FROM poem_tags WHERE poem_id = $1`, [poemId]);
  if (!tags.length) {
    return;
  }

  await query(
    `INSERT INTO poem_tags (poem_id, tag)
     SELECT $1, UNNEST($2::varchar[])
     ON CONFLICT DO NOTHING`,
    [poemId, tags],
  );
};

export const poemsRepository = {
  async listIds(limit = 5000) {
    await ensurePoemsMetadata();
    const safeLimit = Math.max(1, Math.min(limit, 20_000));
    const result = await query<{ id: string }>(
      `SELECT id
       FROM poems
       WHERE COALESCE(is_banned, false) = false
       ORDER BY created_at DESC, id DESC
       LIMIT $1`,
      [safeLimit],
    );
    return result.rows.map((row) => row.id);
  },

  async listPage(input: {
    cursorCreatedAt: string | null;
    cursorId: string | null;
    limit: number;
    includeBanned?: boolean;
  }) {
    await ensurePoemsMetadata();
    const result = await query<PoemRow>(
      `WITH base AS (
        SELECT
          p.id,
          p.title,
          p.summary,
          p.content,
          p.user_id,
          p.read_count,
          COALESCE(p.is_banned, false) AS is_banned,
          p.banned_at,
          p.banned_reason,
          p.created_at,
          p.updated_at
        FROM poems p
        WHERE (
          $1::timestamp IS NULL
          OR p.created_at < $1::timestamp
          OR (p.created_at = $1::timestamp AND p.id < COALESCE($2::varchar, ''))
        )
        AND ($4::boolean = true OR COALESCE(p.is_banned, false) = false)
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT $3
      )
      SELECT
        p.id,
        p.title,
        p.summary,
        p.content,
        p.user_id,
        p.read_count,
        p.is_banned,
        p.banned_at,
        p.banned_reason,
        p.created_at,
        p.updated_at,
        COALESCE(pr.name, u.name) AS author_name,
        COALESCE(pr.avatar_url, u.image) AS author_avatar,
        u.username AS author_username,
        pr.bio AS author_bio,
        pr.urls AS author_urls,
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT c.id), NULL), ARRAY[]::varchar[]) AS category_ids,
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT c.name), NULL), ARRAY[]::varchar[]) AS category_names,
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT pt.tag), NULL), ARRAY[]::varchar[]) AS tags
      FROM base p
      LEFT JOIN poem_categories pc ON pc.poem_id = p.id
      LEFT JOIN categories c ON c.id = pc.category_id
      LEFT JOIN poem_tags pt ON pt.poem_id = p.id
      LEFT JOIN profiles pr ON pr.user_id = p.user_id
      LEFT JOIN "user" u ON u.id = p.user_id
      GROUP BY
        p.id,
        p.title,
        p.summary,
        p.content,
        p.user_id,
        p.read_count,
        p.is_banned,
        p.banned_at,
        p.banned_reason,
        p.created_at,
        p.updated_at,
        pr.name,
        pr.avatar_url,
        pr.bio,
        pr.urls,
        u.name,
        u.image,
        u.username
      ORDER BY p.created_at DESC, p.id DESC`,
      [input.cursorCreatedAt, input.cursorId, input.limit, input.includeBanned ?? false],
    );
    return result.rows;
  },

  async readStats(includeBanned = false) {
    await ensurePoemsMetadata();
    const result = await query<PoemStatsRow>(
      `SELECT
         COUNT(*)::int AS total_count,
         COALESCE(SUM(read_count), 0)::int AS total_reads
       FROM poems
       WHERE ($1::boolean = true OR COALESCE(is_banned, false) = false)`,
      [includeBanned],
    );

    return result.rows[0] ?? { total_count: 0, total_reads: 0 };
  },

  async findById(id: string, includeBanned = false) {
    await ensurePoemsMetadata();
    const result = await query<PoemRow>(
      `SELECT
        p.id,
        p.title,
        p.summary,
        p.content,
        p.user_id,
        p.read_count,
        COALESCE(p.is_banned, false) AS is_banned,
        p.banned_at,
        p.banned_reason,
        p.created_at,
        p.updated_at,
        COALESCE(pr.name, u.name) AS author_name,
        COALESCE(pr.avatar_url, u.image) AS author_avatar,
        u.username AS author_username,
        pr.bio AS author_bio,
        pr.urls AS author_urls,
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT c.id), NULL), ARRAY[]::varchar[]) AS category_ids,
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT c.name), NULL), ARRAY[]::varchar[]) AS category_names,
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT pt.tag), NULL), ARRAY[]::varchar[]) AS tags
      FROM poems p
      LEFT JOIN poem_categories pc ON pc.poem_id = p.id
      LEFT JOIN categories c ON c.id = pc.category_id
      LEFT JOIN poem_tags pt ON pt.poem_id = p.id
      LEFT JOIN profiles pr ON pr.user_id = p.user_id
      LEFT JOIN "user" u ON u.id = p.user_id
      WHERE p.id = $1
        AND ($2::boolean = true OR COALESCE(p.is_banned, false) = false)
      GROUP BY
        p.id,
        p.title,
        p.summary,
        p.content,
        p.user_id,
        p.read_count,
        p.is_banned,
        p.banned_at,
        p.banned_reason,
        p.created_at,
        p.updated_at,
        pr.name,
        pr.avatar_url,
        pr.bio,
        pr.urls,
        u.name,
        u.image,
        u.username`,
      [id, includeBanned],
    );
    return result.rows[0] ?? null;
  },

  async create(input: {
    id: string;
    title: string;
    summary: string | null;
    content: string;
    userId: string;
    categoryIds: string[];
    tags: string[];
  }) {
    await ensurePoemsMetadata();
    await query(
      `INSERT INTO poems (id, title, summary, content, user_id, read_count)
       VALUES ($1, $2, $3, $4, $5, 0)`,
      [input.id, input.title, input.summary, input.content, input.userId],
    );

    await replacePoemCategories(input.id, input.categoryIds);
    await replacePoemTags(input.id, input.tags);
  },

  async update(input: {
    id: string;
    userId: string;
    title: string;
    summary: string | null;
    content: string;
    categoryIds: string[];
    tags: string[];
  }) {
    await ensurePoemsMetadata();
    const result = await query(
      `UPDATE poems
       SET title = $1,
           summary = $2,
           content = $3,
           updated_at = NOW()
       WHERE id = $4 AND user_id = $5`,
      [input.title, input.summary, input.content, input.id, input.userId],
    );

    if (result.rowCount === 0) {
      return result;
    }

    await replacePoemCategories(input.id, input.categoryIds);
    await replacePoemTags(input.id, input.tags);
    return result;
  },

  async remove(id: string, userId: string) {
    return query(`DELETE FROM poems WHERE id = $1 AND user_id = $2`, [id, userId]);
  },

  async incrementRead(id: string) {
    await ensurePoemsMetadata();
    const result = await query<{ read_count: number }>(
      `UPDATE poems
       SET read_count = read_count + 1
       WHERE id = $1 AND COALESCE(is_banned, false) = false
       RETURNING read_count`,
      [id],
    );
    return result.rows[0] ?? null;
  },

  async setBanStatus(input: {
    poemId: string;
    banned: boolean;
    reason: string | null;
    adminUserId: string;
  }) {
    await ensurePoemsMetadata();
    return query(
      `UPDATE poems
       SET
         is_banned = $2,
         banned_at = CASE WHEN $2 THEN NOW() ELSE NULL END,
         banned_reason = CASE WHEN $2 THEN $3 ELSE NULL END,
         banned_by = CASE WHEN $2 THEN $4 ELSE NULL END,
         updated_at = NOW()
       WHERE id = $1`,
      [input.poemId, input.banned, input.reason, input.adminUserId],
    );
  },
};
