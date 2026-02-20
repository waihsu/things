export type PoemEventType = "created" | "updated" | "deleted";

export type PoemEventPayload = {
  type: PoemEventType;
  poem_id: string;
  at: string;
};

type PoemEventListener = (payload: PoemEventPayload) => void;

class PoemsEvents {
  private listeners = new Set<PoemEventListener>();

  subscribe(listener: PoemEventListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(payload: PoemEventPayload) {
    for (const listener of this.listeners) {
      listener(payload);
    }
  }
}

export const poemsEvents = new PoemsEvents();
