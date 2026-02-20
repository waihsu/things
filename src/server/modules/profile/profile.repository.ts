import { query } from "@/src/db/http";

export type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  username: string | null;
  role?: string | null;
};

export type PublicUserRow = {
  id: string;
  name: string | null;
  image: string | null;
  username: string | null;
};

export type ProfileRow = {
  id: string | null;
  user_id: string;
  name: string | null;
  phone_number: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  bio: string | null;
  avatar_url: string | null;
  urls: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_name: string | null;
  user_email: string | null;
  user_image: string | null;
  user_username: string | null;
};

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  stories_count: string | number | null;
  poems_count: string | number | null;
  series_count: string | number | null;
  total_reads: string | number | null;
  total_comments: string | number | null;
  last_active_at: string | null;
};

export const profileRepository = {
  async findUserById(userId: string) {
    const result = await query<UserRow>(
      `SELECT id, name, email, image, username
       FROM "user"
       WHERE id = $1`,
      [userId],
    );
    return result.rows[0] ?? null;
  },

  async findUserByHandle(handle: string) {
    const result = await query<PublicUserRow>(
      `SELECT id, name, image, username
       FROM "user"
       WHERE username = $1 OR id = $1
       LIMIT 1`,
      [handle],
    );
    return result.rows[0] ?? null;
  },

  async findProfileByUserId(userId: string) {
    const result = await query<ProfileRow>(
      `SELECT
        p.id,
        p.user_id,
        p.name,
        p.phone_number,
        p.street,
        p.city,
        p.state,
        p.zip_code,
        p.country,
        p.bio,
        p.avatar_url,
        p.urls,
        p.created_at,
        p.updated_at,
        u.name AS user_name,
        u.email AS user_email,
        u.image AS user_image,
        u.username AS user_username
      FROM profiles p
      LEFT JOIN "user" u ON u.id = p.user_id
      WHERE p.user_id = $1`,
      [userId],
    );
    return result.rows[0] ?? null;
  },

  async findUsernameTaken(username: string, userId: string) {
    const result = await query<{ id: string }>(
      `SELECT id FROM "user" WHERE username = $1 AND id <> $2 LIMIT 1`,
      [username, userId],
    );
    return result.rows.length > 0;
  },

  async updateUsername(userId: string, username: string | null) {
    await query(`UPDATE "user" SET username = $1 WHERE id = $2`, [username, userId]);
  },

  async updateUserBanStatus(input: {
    userId: string;
    banned: boolean;
    reason: string | null;
    expiresAt: number | null;
  }) {
    const result = await query<{ id: string }>(
      `UPDATE "user"
       SET
         banned = $2,
         "banReason" = $3,
         "banExpires" = $4,
         "updatedAt" = NOW()
       WHERE id = $1
       RETURNING id`,
      [input.userId, input.banned, input.reason, input.expiresAt],
    );
    return result.rows[0] ?? null;
  },

  async upsertProfile(input: {
    id: string;
    userId: string;
    name: string | null;
    phone_number: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    country: string | null;
    bio: string | null;
    avatar_url: string | null;
    urls: string | null;
  }) {
    const result = await query<ProfileRow>(
      `INSERT INTO profiles (
         id,
         user_id,
         name,
         phone_number,
         street,
         city,
         state,
         zip_code,
         country,
         bio,
         avatar_url,
         urls
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (user_id) DO UPDATE SET
         name = EXCLUDED.name,
         phone_number = EXCLUDED.phone_number,
         street = EXCLUDED.street,
         city = EXCLUDED.city,
         state = EXCLUDED.state,
         zip_code = EXCLUDED.zip_code,
         country = EXCLUDED.country,
         bio = EXCLUDED.bio,
         avatar_url = EXCLUDED.avatar_url,
         urls = EXCLUDED.urls,
         updated_at = NOW()
       RETURNING
         id,
         user_id,
         name,
         phone_number,
         street,
         city,
         state,
         zip_code,
         country,
         bio,
         avatar_url,
         urls,
         created_at,
         updated_at`,
      [
        input.id,
        input.userId,
        input.name,
        input.phone_number,
        input.street,
        input.city,
        input.state,
        input.zip_code,
        input.country,
        input.bio,
        input.avatar_url,
        input.urls,
      ],
    );
    return result.rows[0] ?? null;
  },

  async readStats(userId: string) {
    const result = await query<{
      stories_count: string;
      series_count: string;
      episodes_count: string;
    }>(
      `SELECT
        (SELECT COUNT(*) FROM short_stories s WHERE s.user_id = $1) AS stories_count,
        (SELECT COUNT(*) FROM series se WHERE se.user_id = $1) AS series_count,
        (SELECT COUNT(*) FROM episodes e JOIN series se ON se.id = e.serie_id WHERE se.user_id = $1) AS episodes_count`,
      [userId],
    );
    return result.rows[0] ?? {
      stories_count: "0",
      series_count: "0",
      episodes_count: "0",
    };
  },

  async readStoryViews(userId: string) {
    const result = await query<{ story_reads: string }>(
      `SELECT COALESCE(SUM(read_count), 0) AS story_reads
       FROM short_stories
       WHERE user_id = $1`,
      [userId],
    );
    return Number(result.rows[0]?.story_reads ?? 0);
  },

  async readSeriesViews(userId: string) {
    const result = await query<{ series_reads: string }>(
      `SELECT COALESCE(SUM(read_count), 0) AS series_reads
       FROM series
       WHERE user_id = $1`,
      [userId],
    );
    return Number(result.rows[0]?.series_reads ?? 0);
  },

  async countUsersForAdmin(search: string) {
    const normalized = search.trim();
    const like = `%${normalized}%`;

    const result = await query<{ total_count: string | number }>(
      `SELECT COUNT(*) AS total_count
       FROM "user" u
       WHERE
         ($1 = '' OR
          COALESCE(u.name, '') ILIKE $2 OR
          COALESCE(u.username, '') ILIKE $2 OR
          COALESCE(u.email, '') ILIKE $2 OR
          u.id ILIKE $2)`,
      [normalized, like],
    );

    return Number(result.rows[0]?.total_count ?? 0);
  },

  async listUsersForAdmin(input: {
    search: string;
    limit: number;
    offset: number;
    sortBy: "recent" | "name" | "activity";
  }) {
    const normalized = input.search.trim();
    const like = `%${normalized}%`;

    const orderBy =
      input.sortBy === "name"
        ? `COALESCE(u.name, u.username, u.email, u.id) ASC, u."createdAt" DESC`
        : input.sortBy === "activity"
          ? `last_active_at DESC, u."createdAt" DESC`
          : `u."createdAt" DESC`;

    const result = await query<AdminUserRow>(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.username,
         u.image,
         u.role,
         u.banned,
         u."createdAt" AS created_at,
         u."updatedAt" AS updated_at,
         COALESCE(ss.stories_count, 0) AS stories_count,
         COALESCE(ps.poems_count, 0) AS poems_count,
         COALESCE(se.series_count, 0) AS series_count,
         COALESCE(ss.story_reads, 0) + COALESCE(ps.poem_reads, 0) + COALESCE(se.series_reads, 0) AS total_reads,
         COALESCE(cs.total_comments, 0) AS total_comments,
         GREATEST(
           COALESCE(ss.last_story_at, TIMESTAMP 'epoch'),
           COALESCE(ps.last_poem_at, TIMESTAMP 'epoch'),
           COALESCE(se.last_series_at, TIMESTAMP 'epoch'),
           COALESCE(cs.last_comment_at, TIMESTAMP 'epoch'),
           COALESCE(ch.last_chat_at, TIMESTAMP 'epoch'),
           COALESCE(u."updatedAt", TIMESTAMP 'epoch')
         ) AS last_active_at
       FROM "user" u
       LEFT JOIN (
         SELECT
           user_id,
           COUNT(*) AS stories_count,
           COALESCE(SUM(read_count), 0) AS story_reads,
           MAX(created_at) AS last_story_at
         FROM short_stories
         GROUP BY user_id
       ) ss ON ss.user_id = u.id
       LEFT JOIN (
         SELECT
           user_id,
           COUNT(*) AS poems_count,
           COALESCE(SUM(read_count), 0) AS poem_reads,
           MAX(created_at) AS last_poem_at
         FROM poems
         GROUP BY user_id
       ) ps ON ps.user_id = u.id
       LEFT JOIN (
         SELECT
           user_id,
           COUNT(*) AS series_count,
           COALESCE(SUM(read_count), 0) AS series_reads,
           MAX(created_at) AS last_series_at
         FROM series
         GROUP BY user_id
       ) se ON se.user_id = u.id
       LEFT JOIN (
         SELECT
           user_id,
           COUNT(*) AS total_comments,
           MAX(created_at) AS last_comment_at
         FROM comments
         GROUP BY user_id
       ) cs ON cs.user_id = u.id
       LEFT JOIN (
         SELECT
           user_id,
           MAX(created_at) AS last_chat_at
         FROM chat_messages
         WHERE user_id IS NOT NULL
         GROUP BY user_id
       ) ch ON ch.user_id = u.id
       WHERE
         ($1 = '' OR
          COALESCE(u.name, '') ILIKE $2 OR
          COALESCE(u.username, '') ILIKE $2 OR
          COALESCE(u.email, '') ILIKE $2 OR
          u.id ILIKE $2)
       ORDER BY ${orderBy}
       LIMIT $3 OFFSET $4`,
      [normalized, like, input.limit, input.offset],
    );

    return result.rows;
  },
};
