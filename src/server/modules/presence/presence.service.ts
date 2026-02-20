import { presenceEvents, type PresenceStatusPayload } from "./presence.events";

const MAX_PRESENCE_IDS = 80;

const activeConnections = new Map<string, Set<string>>();
const lastSeenAtByUser = new Map<string, string>();
const updatedAtByUser = new Map<string, string>();

const nowIso = () => new Date().toISOString();

const buildStatus = (userId: string): PresenceStatusPayload => {
  const activeCount = activeConnections.get(userId)?.size ?? 0;
  const online = activeCount > 0;
  const fallback = nowIso();
  const updated_at = updatedAtByUser.get(userId) ?? fallback;
  const last_seen_at = online ? null : (lastSeenAtByUser.get(userId) ?? updated_at);

  return {
    user_id: userId,
    online,
    last_seen_at,
    updated_at,
  };
};

const emitStatus = (userId: string) => {
  const status = buildStatus(userId);
  presenceEvents.emit(status);
  return status;
};

const normalizeIds = (rawIds: string) => {
  const deduped = new Set<string>();
  for (const token of rawIds.split(",")) {
    const id = token.trim();
    if (!id) continue;
    deduped.add(id);
    if (deduped.size >= MAX_PRESENCE_IDS) break;
  }
  return [...deduped];
};

export const presenceService = {
  parseIds(rawIds?: string | null) {
    if (!rawIds) return [];
    return normalizeIds(rawIds);
  },

  getStatus(userId: string) {
    return buildStatus(userId);
  },

  listStatuses(userIds: string[]) {
    return userIds.map((userId) => buildStatus(userId));
  },

  connect(userId: string, connectionId: string) {
    const existing = activeConnections.get(userId) ?? new Set<string>();
    const wasOnline = existing.size > 0;
    existing.add(connectionId);
    activeConnections.set(userId, existing);
    updatedAtByUser.set(userId, nowIso());

    if (!wasOnline) {
      return emitStatus(userId);
    }

    return buildStatus(userId);
  },

  disconnect(userId: string, connectionId: string) {
    const existing = activeConnections.get(userId);
    if (!existing) {
      return buildStatus(userId);
    }

    const wasOnline = existing.size > 0;
    existing.delete(connectionId);
    const afterCount = existing.size;
    const at = nowIso();
    updatedAtByUser.set(userId, at);

    if (afterCount === 0) {
      activeConnections.delete(userId);
      lastSeenAtByUser.set(userId, at);

      if (wasOnline) {
        return emitStatus(userId);
      }
    }

    return buildStatus(userId);
  },
};
