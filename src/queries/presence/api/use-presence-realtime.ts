import { useEffect } from "react";
import type { PresenceStatus } from "./types";
import { useAuthStore } from "@/src/store/use-auth-store";
import { usePresenceStore } from "@/src/store/use-presence-store";

type PresenceReadyPayload = {
  self?: PresenceStatus;
};

const parsePresenceStatus = (raw: string) => {
  try {
    return JSON.parse(raw) as PresenceStatus;
  } catch (error) {
    console.error("[presence] failed to parse payload:", error);
    return null;
  }
};

const parseReadyPayload = (raw: string) => {
  try {
    return JSON.parse(raw) as PresenceReadyPayload;
  } catch (error) {
    console.error("[presence] failed to parse ready payload:", error);
    return null;
  }
};

export function usePresenceRealtime() {
  const { isAuthenticated } = useAuthStore();
  const setStatus = usePresenceStore((state) => state.setStatus);

  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    const eventSource = new EventSource("/api/v1/presence/stream", {
      withCredentials: true,
    });

    eventSource.addEventListener("ready", (event) => {
      if (!(event instanceof MessageEvent)) return;
      const payload = parseReadyPayload(event.data);
      if (!payload?.self) return;
      setStatus(payload.self);
    });

    eventSource.addEventListener("presence", (event) => {
      if (!(event instanceof MessageEvent)) return;
      const payload = parsePresenceStatus(event.data);
      if (!payload) return;
      setStatus(payload);
    });

    return () => {
      eventSource.close();
    };
  }, [isAuthenticated, setStatus]);
}
