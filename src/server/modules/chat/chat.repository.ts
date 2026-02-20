import { query } from "@/src/db/http";

type ChatMessageRow = {
  id: string;
  user_id: string | null;
  user_name: string;
  user_avatar: string | null;
  user_username: string | null;
  is_guest: boolean;
  content: string;
  created_at: string;
};

type ChatUserRow = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  email: string | null;
};

type ChatDirectMessageRow = {
  id: string;
  sender_user_id: string;
  receiver_user_id: string;
  content: string;
  created_at: string;
  sender_name: string | null;
  sender_avatar: string | null;
  sender_username: string | null;
  sender_email: string | null;
  receiver_name: string | null;
  receiver_avatar: string | null;
  receiver_username: string | null;
  receiver_email: string | null;
};

type ChatDirectConversationRow = {
  user_id: string;
  user_name: string | null;
  user_username: string | null;
  user_avatar: string | null;
  user_email: string | null;
  last_message_id: string;
  last_text: string;
  last_created_at: string;
  last_sender_user_id: string;
};

let ensureChatTablePromise: Promise<void> | null = null;
let ensureChatDirectTablePromise: Promise<void> | null = null;

const ensureChatTable = async () => {
  if (!ensureChatTablePromise) {
    ensureChatTablePromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id varchar(36) PRIMARY KEY,
          user_id varchar(255) REFERENCES "user"(id) ON DELETE SET NULL,
          user_name varchar(100) NOT NULL,
          user_avatar text,
          user_username varchar(200),
          is_guest boolean NOT NULL DEFAULT false,
          content text NOT NULL,
          created_at timestamp NOT NULL DEFAULT NOW()
        )
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx
        ON chat_messages (created_at DESC, id DESC)
      `);
    })().catch((error) => {
      ensureChatTablePromise = null;
      throw error;
    });
  }

  await ensureChatTablePromise;
};

const ensureChatDirectTable = async () => {
  if (!ensureChatDirectTablePromise) {
    ensureChatDirectTablePromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS chat_direct_messages (
          id varchar(36) PRIMARY KEY,
          sender_user_id varchar(255) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
          receiver_user_id varchar(255) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
          content text NOT NULL,
          created_at timestamp NOT NULL DEFAULT NOW(),
          CONSTRAINT chat_direct_messages_no_self CHECK (sender_user_id <> receiver_user_id)
        )
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS chat_direct_messages_sender_idx
        ON chat_direct_messages (sender_user_id, created_at DESC, id DESC)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS chat_direct_messages_receiver_idx
        ON chat_direct_messages (receiver_user_id, created_at DESC, id DESC)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS chat_direct_messages_pair_idx
        ON chat_direct_messages (
          LEAST(sender_user_id, receiver_user_id),
          GREATEST(sender_user_id, receiver_user_id),
          created_at DESC,
          id DESC
        )
      `);
    })().catch((error) => {
      ensureChatDirectTablePromise = null;
      throw error;
    });
  }

  await ensureChatDirectTablePromise;
};

export const chatRepository = {
  async listRecent(limit: number) {
    await ensureChatTable();
    const safeLimit = Math.max(1, Math.min(limit, 120));
    const result = await query<ChatMessageRow>(
      `WITH recent AS (
         SELECT
           id,
           user_id,
           user_name,
           user_avatar,
           user_username,
           is_guest,
           content,
           created_at
         FROM chat_messages
         ORDER BY created_at DESC, id DESC
         LIMIT $1
       )
       SELECT
         id,
         user_id,
         user_name,
         user_avatar,
         user_username,
         is_guest,
         content,
         created_at
       FROM recent
       ORDER BY created_at ASC, id ASC`,
      [safeLimit],
    );
    return result.rows;
  },

  async create(input: {
    id: string;
    userId: string | null;
    userName: string;
    userAvatar: string | null;
    userUsername: string | null;
    isGuest: boolean;
    content: string;
  }) {
    await ensureChatTable();
    await query(
      `INSERT INTO chat_messages (
         id,
         user_id,
         user_name,
         user_avatar,
         user_username,
         is_guest,
         content
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        input.id,
        input.userId,
        input.userName,
        input.userAvatar,
        input.userUsername,
        input.isGuest,
        input.content,
      ],
    );
  },

  async findUserById(userId: string) {
    const result = await query<ChatUserRow>(
      `SELECT id, name, username, image, email
       FROM "user"
       WHERE id = $1
       LIMIT 1`,
      [userId],
    );
    return result.rows[0] ?? null;
  },

  async listUsersForDirectory(input: {
    viewerUserId: string;
    search: string;
    limit: number;
  }) {
    const normalizedSearch = input.search.trim();
    const like = `%${normalizedSearch}%`;
    const safeLimit = Math.max(1, Math.min(input.limit, 60));

    const result = await query<ChatUserRow>(
      `SELECT id, name, username, image, email
       FROM "user"
       WHERE
         id <> $1
         AND (
           $2 = '' OR
           COALESCE(name, '') ILIKE $3 OR
           COALESCE(username, '') ILIKE $3 OR
           COALESCE(email, '') ILIKE $3
         )
       ORDER BY COALESCE("updatedAt", "createdAt") DESC
       LIMIT $4`,
      [input.viewerUserId, normalizedSearch, like, safeLimit],
    );

    return result.rows;
  },

  async listDirectConversations(userId: string, limit: number) {
    await ensureChatDirectTable();
    const safeLimit = Math.max(1, Math.min(limit, 80));
    const result = await query<ChatDirectConversationRow>(
      `WITH scoped AS (
         SELECT
           id,
           sender_user_id,
           receiver_user_id,
           content,
           created_at,
           CASE
             WHEN sender_user_id = $1 THEN receiver_user_id
             ELSE sender_user_id
           END AS counterpart_user_id
         FROM chat_direct_messages
         WHERE sender_user_id = $1 OR receiver_user_id = $1
       ),
       ranked AS (
         SELECT
           id,
           sender_user_id,
           content,
           created_at,
           counterpart_user_id,
           ROW_NUMBER() OVER (
             PARTITION BY counterpart_user_id
             ORDER BY created_at DESC, id DESC
           ) AS rn
         FROM scoped
       )
       SELECT
         r.counterpart_user_id AS user_id,
         u.name AS user_name,
         u.username AS user_username,
         u.image AS user_avatar,
         u.email AS user_email,
         r.id AS last_message_id,
         r.content AS last_text,
         r.created_at AS last_created_at,
         r.sender_user_id AS last_sender_user_id
       FROM ranked r
       INNER JOIN "user" u ON u.id = r.counterpart_user_id
       WHERE r.rn = 1
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT $2`,
      [userId, safeLimit],
    );
    return result.rows;
  },

  async listDirectMessages(input: {
    userId: string;
    targetUserId: string;
    limit: number;
  }) {
    await ensureChatDirectTable();
    const safeLimit = Math.max(1, Math.min(input.limit, 120));
    const result = await query<ChatDirectMessageRow>(
      `WITH recent AS (
         SELECT
           id,
           sender_user_id,
           receiver_user_id,
           content,
           created_at
         FROM chat_direct_messages
         WHERE
           (sender_user_id = $1 AND receiver_user_id = $2)
           OR
           (sender_user_id = $2 AND receiver_user_id = $1)
         ORDER BY created_at DESC, id DESC
         LIMIT $3
       )
       SELECT
         r.id,
         r.sender_user_id,
         r.receiver_user_id,
         r.content,
         r.created_at,
         sender_u.name AS sender_name,
         sender_u.image AS sender_avatar,
         sender_u.username AS sender_username,
         sender_u.email AS sender_email,
         receiver_u.name AS receiver_name,
         receiver_u.image AS receiver_avatar,
         receiver_u.username AS receiver_username,
         receiver_u.email AS receiver_email
       FROM recent r
       INNER JOIN "user" sender_u ON sender_u.id = r.sender_user_id
       INNER JOIN "user" receiver_u ON receiver_u.id = r.receiver_user_id
       ORDER BY r.created_at ASC, r.id ASC`,
      [input.userId, input.targetUserId, safeLimit],
    );
    return result.rows;
  },

  async createDirectMessage(input: {
    id: string;
    senderUserId: string;
    receiverUserId: string;
    content: string;
  }) {
    await ensureChatDirectTable();
    await query(
      `INSERT INTO chat_direct_messages (
         id,
         sender_user_id,
         receiver_user_id,
         content
       )
       VALUES ($1, $2, $3, $4)`,
      [input.id, input.senderUserId, input.receiverUserId, input.content],
    );
  },

  async findDirectMessageById(messageId: string) {
    await ensureChatDirectTable();
    const result = await query<ChatDirectMessageRow>(
      `SELECT
         m.id,
         m.sender_user_id,
         m.receiver_user_id,
         m.content,
         m.created_at,
         sender_u.name AS sender_name,
         sender_u.image AS sender_avatar,
         sender_u.username AS sender_username,
         sender_u.email AS sender_email,
         receiver_u.name AS receiver_name,
         receiver_u.image AS receiver_avatar,
         receiver_u.username AS receiver_username,
         receiver_u.email AS receiver_email
       FROM chat_direct_messages m
       INNER JOIN "user" sender_u ON sender_u.id = m.sender_user_id
       INNER JOIN "user" receiver_u ON receiver_u.id = m.receiver_user_id
       WHERE m.id = $1
       LIMIT 1`,
      [messageId],
    );
    return result.rows[0] ?? null;
  },
};
