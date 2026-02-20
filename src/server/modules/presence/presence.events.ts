export type PresenceStatusPayload = {
  user_id: string;
  online: boolean;
  last_seen_at: string | null;
  updated_at: string;
};

type PresenceListener = (payload: PresenceStatusPayload) => void;

class PresenceEvents {
  private listeners = new Set<PresenceListener>();

  subscribe(listener: PresenceListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(payload: PresenceStatusPayload) {
    for (const listener of this.listeners) {
      listener(payload);
    }
  }
}

export const presenceEvents = new PresenceEvents();
