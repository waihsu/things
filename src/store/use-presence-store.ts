import { create } from "zustand";
import type { PresenceStatus } from "@/src/queries/presence/api/types";

type PresenceState = {
  statusByUserId: Record<string, PresenceStatus>;
  setStatus: (status: PresenceStatus) => void;
  setStatuses: (statuses: PresenceStatus[]) => void;
};

export const usePresenceStore = create<PresenceState>((set) => ({
  statusByUserId: {},

  setStatus: (status) =>
    set((state) => ({
      statusByUserId: {
        ...state.statusByUserId,
        [status.user_id]: status,
      },
    })),

  setStatuses: (statuses) =>
    set((state) => {
      const next = { ...state.statusByUserId };
      for (const status of statuses) {
        next[status.user_id] = status;
      }
      return { statusByUserId: next };
    }),
}));
