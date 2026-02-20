export type PresenceStatus = {
  user_id: string;
  online: boolean;
  last_seen_at: string | null;
  updated_at: string;
};

export type PresenceByUserId = Record<string, PresenceStatus | undefined>;
