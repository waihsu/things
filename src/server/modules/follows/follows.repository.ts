import { query } from "@/src/db/http";

type FollowSummaryRow = {
  followers_count: string | number;
  following_count: string | number;
  is_following: boolean;
};

let ensureFollowsTablePromise: Promise<void> | null = null;

const ensureFollowsTable = async () => {
  if (!ensureFollowsTablePromise) {
    ensureFollowsTablePromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS user_follows (
          follower_id varchar(255) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
          followee_id varchar(255) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
          created_at timestamp NOT NULL DEFAULT NOW(),
          PRIMARY KEY (follower_id, followee_id),
          CONSTRAINT user_follows_no_self_follow CHECK (follower_id <> followee_id)
        )
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS user_follows_followee_idx
        ON user_follows (followee_id, created_at DESC)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS user_follows_follower_idx
        ON user_follows (follower_id, created_at DESC)
      `);
    })().catch((error) => {
      ensureFollowsTablePromise = null;
      throw error;
    });
  }

  await ensureFollowsTablePromise;
};

export const followsRepository = {
  async userExists(userId: string) {
    await ensureFollowsTable();
    const result = await query<{ id: string }>(
      `SELECT id FROM "user" WHERE id = $1 LIMIT 1`,
      [userId],
    );
    return result.rows.length > 0;
  },

  async readSummary(targetUserId: string, viewerUserId: string | null) {
    await ensureFollowsTable();
    const result = await query<FollowSummaryRow>(
      `SELECT
         (SELECT COUNT(*) FROM user_follows WHERE followee_id = $1) AS followers_count,
         (SELECT COUNT(*) FROM user_follows WHERE follower_id = $1) AS following_count,
         CASE
           WHEN $2::text IS NULL THEN false
           ELSE EXISTS (
             SELECT 1
             FROM user_follows
             WHERE follower_id = $2 AND followee_id = $1
           )
         END AS is_following`,
      [targetUserId, viewerUserId],
    );

    const row = result.rows[0];
    return {
      followers_count: Number(row?.followers_count ?? 0),
      following_count: Number(row?.following_count ?? 0),
      is_following: Boolean(row?.is_following),
    };
  },

  async follow(followerUserId: string, followeeUserId: string) {
    await ensureFollowsTable();
    await query(
      `INSERT INTO user_follows (follower_id, followee_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, followee_id) DO NOTHING`,
      [followerUserId, followeeUserId],
    );
  },

  async unfollow(followerUserId: string, followeeUserId: string) {
    await ensureFollowsTable();
    await query(
      `DELETE FROM user_follows
       WHERE follower_id = $1 AND followee_id = $2`,
      [followerUserId, followeeUserId],
    );
  },
};
