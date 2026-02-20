export type ChatUser = {
  id: string;
  name: string;
  avatar: string | null;
  username: string | null;
};

export type DirectMessage = {
  id: string;
  text: string;
  created_at: string;
  sender: ChatUser;
  recipient: ChatUser;
};

export type Conversation = {
  user: ChatUser;
  last_message: {
    id: string;
    text: string;
    created_at: string;
    sender_user_id: string;
  };
};

export type ChatWsEvent =
  | {
      type: "chat:welcome";
      payload: {
        online_count: number;
        user: {
          id: string;
          name: string;
          avatar: string | null;
          username: string | null;
          guest: boolean;
        };
      };
    }
  | {
      type: "chat:dm";
      payload: DirectMessage;
    }
  | {
      type: "chat:error";
      payload: {
        message: string;
      };
    };

export const MAX_DRAFT_LENGTH = 500;

export const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Now";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

export const parseDirectEvent = (raw: string) => {
  try {
    return JSON.parse(raw) as ChatWsEvent;
  } catch {
    return null;
  }
};

export const upsertDirectMessage = (
  current: DirectMessage[],
  incoming: DirectMessage,
) => {
  if (current.some((message) => message.id === incoming.id)) {
    return current;
  }
  return [...current, incoming].slice(-240);
};

export const upsertConversationWithMessage = (
  current: Conversation[],
  incoming: DirectMessage,
  currentUserId: string,
) => {
  const counterpart =
    incoming.sender.id === currentUserId ? incoming.recipient : incoming.sender;

  const next: Conversation[] = [
    {
      user: counterpart,
      last_message: {
        id: incoming.id,
        text: incoming.text,
        created_at: incoming.created_at,
        sender_user_id: incoming.sender.id,
      },
    },
  ];

  for (const conversation of current) {
    if (conversation.user.id === counterpart.id) {
      continue;
    }
    next.push(conversation);
  }

  return next.slice(0, 80);
};
