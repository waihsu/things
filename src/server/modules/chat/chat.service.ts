import type { AppUser } from "@/src/server/types";
import { ServiceError } from "@/src/server/utils/service-error";
import { chatRepository } from "./chat.repository";

const MAX_MESSAGE_LENGTH = 500;
const MAX_NAME_LENGTH = 40;

export type ChatParticipant = {
  id: string;
  name: string;
  avatar: string | null;
  username: string | null;
  guest: boolean;
};

export type ChatMessage = {
  id: string;
  text: string;
  created_at: string;
  user: ChatParticipant;
};

export type ChatUserIdentity = {
  id: string;
  name: string;
  avatar: string | null;
  username: string | null;
};

export type ChatDirectMessage = {
  id: string;
  text: string;
  created_at: string;
  sender: ChatUserIdentity;
  recipient: ChatUserIdentity;
};

export type ChatDirectConversation = {
  user: ChatUserIdentity;
  last_message: {
    id: string;
    text: string;
    created_at: string;
    sender_user_id: string;
  };
};

const participantsByConnectionId = new Map<string, ChatParticipant>();

const countOnlineUsers = () => {
  const userIds = new Set<string>();
  for (const participant of participantsByConnectionId.values()) {
    userIds.add(participant.id);
  }
  return userIds.size;
};

const trimToNull = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const readUsername = (user: AppUser | null) => {
  if (!user) return null;
  const raw = (user as AppUser & { username?: unknown }).username;
  return trimToNull(raw);
};

const buildDisplayName = (input: {
  user: AppUser | null;
  nameHint?: string | null;
}) => {
  const hintedName = trimToNull(input.nameHint)?.slice(0, MAX_NAME_LENGTH);
  if (input.user) {
    return (
      trimToNull(input.user.name)?.slice(0, MAX_NAME_LENGTH) ??
      readUsername(input.user)?.slice(0, MAX_NAME_LENGTH) ??
      trimToNull(input.user.email)?.split("@")[0]?.slice(0, MAX_NAME_LENGTH) ??
      hintedName ??
      "User"
    );
  }

  return hintedName ?? "Guest";
};

const sanitizeMessageText = (raw: unknown) => {
  if (typeof raw !== "string") return null;
  const normalized = raw.trim();
  if (!normalized) return null;
  return normalized.slice(0, MAX_MESSAGE_LENGTH);
};

const ensureUser = (user: AppUser | null): AppUser => {
  if (!user) {
    throw new ServiceError("Unauthorized", 401);
  }
  return user;
};

const normalizeUserId = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const buildUserDisplayName = (input: {
  name?: string | null;
  username?: string | null;
  email?: string | null;
}) => {
  const name = trimToNull(input.name)?.slice(0, MAX_NAME_LENGTH);
  if (name) return name;
  const username = trimToNull(input.username)?.slice(0, MAX_NAME_LENGTH);
  if (username) return username;
  const emailPrefix = trimToNull(input.email)?.split("@")[0]?.slice(0, MAX_NAME_LENGTH);
  if (emailPrefix) return emailPrefix;
  return "User";
};

const mapUserIdentity = (input: {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  email: string | null;
}) =>
  ({
    id: input.id,
    name: buildUserDisplayName({
      name: input.name,
      username: input.username,
      email: input.email,
    }),
    avatar: input.avatar,
    username: trimToNull(input.username),
  }) satisfies ChatUserIdentity;

const mapDirectMessage = (row: {
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
}) =>
  ({
    id: row.id,
    text: row.content,
    created_at: row.created_at,
    sender: mapUserIdentity({
      id: row.sender_user_id,
      name: row.sender_name,
      username: row.sender_username,
      avatar: row.sender_avatar,
      email: row.sender_email,
    }),
    recipient: mapUserIdentity({
      id: row.receiver_user_id,
      name: row.receiver_name,
      username: row.receiver_username,
      avatar: row.receiver_avatar,
      email: row.receiver_email,
    }),
  }) satisfies ChatDirectMessage;

export const chatService = {
  resolveParticipant(input: { user: AppUser | null; nameHint?: string | null }) {
    const currentUser = input.user;
    const displayName = buildDisplayName(input);
    const username = readUsername(currentUser);

    if (currentUser) {
      return {
        id: currentUser.id,
        name: displayName,
        avatar: trimToNull(currentUser.image),
        username,
        guest: false,
      } satisfies ChatParticipant;
    }

    return {
      id: `guest-${crypto.randomUUID().slice(0, 8)}`,
      name: displayName,
      avatar: null,
      username: null,
      guest: true,
    } satisfies ChatParticipant;
  },

  connect(connectionId: string, participant: ChatParticipant) {
    participantsByConnectionId.set(connectionId, participant);
    return countOnlineUsers();
  },

  disconnect(connectionId: string) {
    participantsByConnectionId.delete(connectionId);
    return countOnlineUsers();
  },

  getOnlineCount() {
    return countOnlineUsers();
  },

  async listMessages(limit = 50) {
    const rows = await chatRepository.listRecent(limit);
    return rows.map((row) => ({
      id: row.id,
      text: row.content,
      created_at: row.created_at,
      user: {
        id: row.user_id ?? `guest-${row.id.slice(0, 8)}`,
        name: row.user_name,
        avatar: row.user_avatar,
        username: row.user_username,
        guest: row.is_guest,
      },
    })) satisfies ChatMessage[];
  },

  async createMessage(participant: ChatParticipant, text: unknown) {
    const safeText = sanitizeMessageText(text);
    if (!safeText) {
      return null;
    }

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      text: safeText,
      created_at: new Date().toISOString(),
      user: participant,
    };

    await chatRepository.create({
      id: message.id,
      userId: participant.guest ? null : participant.id,
      userName: participant.name,
      userAvatar: participant.avatar,
      userUsername: participant.username,
      isGuest: participant.guest,
      content: message.text,
    });

    return message;
  },

  async listDirectoryUsers(user: AppUser | null, input: { search?: string; limit?: number }) {
    const currentUser = ensureUser(user);
    const rows = await chatRepository.listUsersForDirectory({
      viewerUserId: currentUser.id,
      search: String(input.search ?? "").trim(),
      limit: Math.max(1, Math.min(Number(input.limit ?? 30) || 30, 60)),
    });

    return rows.map((row) =>
      mapUserIdentity({
        id: row.id,
        name: row.name,
        username: row.username,
        avatar: row.image,
        email: row.email,
      }),
    );
  },

  async listDirectConversations(user: AppUser | null, limit = 30) {
    const currentUser = ensureUser(user);
    const rows = await chatRepository.listDirectConversations(
      currentUser.id,
      Math.max(1, Math.min(limit, 80)),
    );

    return rows.map((row) => ({
      user: mapUserIdentity({
        id: row.user_id,
        name: row.user_name,
        username: row.user_username,
        avatar: row.user_avatar,
        email: row.user_email,
      }),
      last_message: {
        id: row.last_message_id,
        text: row.last_text,
        created_at: row.last_created_at,
        sender_user_id: row.last_sender_user_id,
      },
    })) satisfies ChatDirectConversation[];
  },

  async listDirectMessages(
    user: AppUser | null,
    targetUserIdRaw: string,
    limit = 80,
  ) {
    const currentUser = ensureUser(user);
    const targetUserId = normalizeUserId(targetUserIdRaw);

    if (!targetUserId) {
      throw new ServiceError("Target user is required", 400);
    }
    if (targetUserId === currentUser.id) {
      throw new ServiceError("You cannot open a chat with yourself", 400);
    }

    const targetUser = await chatRepository.findUserById(targetUserId);
    if (!targetUser) {
      throw new ServiceError("User not found", 404);
    }

    const rows = await chatRepository.listDirectMessages({
      userId: currentUser.id,
      targetUserId,
      limit: Math.max(1, Math.min(limit, 120)),
    });

    return {
      target: mapUserIdentity({
        id: targetUser.id,
        name: targetUser.name,
        username: targetUser.username,
        avatar: targetUser.image,
        email: targetUser.email,
      }),
      messages: rows.map((row) => mapDirectMessage(row)),
    };
  },

  async createDirectMessage(input: {
    senderParticipant: ChatParticipant;
    targetUserIdRaw: string;
    text: unknown;
  }) {
    if (input.senderParticipant.guest) {
      throw new ServiceError("Sign in to send direct messages", 401);
    }

    const senderUserId = normalizeUserId(input.senderParticipant.id);
    const targetUserId = normalizeUserId(input.targetUserIdRaw);
    if (!targetUserId) {
      throw new ServiceError("Target user is required", 400);
    }
    if (senderUserId === targetUserId) {
      throw new ServiceError("You cannot message yourself", 400);
    }

    const safeText = sanitizeMessageText(input.text);
    if (!safeText) {
      throw new ServiceError("Message cannot be empty", 400);
    }

    const targetUser = await chatRepository.findUserById(targetUserId);
    if (!targetUser) {
      throw new ServiceError("User not found", 404);
    }

    const messageId = crypto.randomUUID();
    await chatRepository.createDirectMessage({
      id: messageId,
      senderUserId,
      receiverUserId: targetUser.id,
      content: safeText,
    });

    const row = await chatRepository.findDirectMessageById(messageId);
    if (!row) {
      throw new ServiceError("Failed to create direct message", 500);
    }

    return mapDirectMessage(row);
  },
};
