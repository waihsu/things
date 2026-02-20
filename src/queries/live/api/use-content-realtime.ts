import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/src/store/use-auth-store";

type LiveContentKind = "story" | "poem" | "series";
type LiveContentAction = "created" | "updated" | "deleted" | "banned" | "unbanned";

type LiveContentPayload = {
  kind: LiveContentKind;
  action: LiveContentAction;
  id: string;
  at: string;
};

const parseLivePayload = (raw: string): LiveContentPayload | null => {
  try {
    const parsed = JSON.parse(raw) as LiveContentPayload;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    if (
      (parsed.kind !== "story" && parsed.kind !== "poem" && parsed.kind !== "series") ||
      (parsed.action !== "created" &&
        parsed.action !== "updated" &&
        parsed.action !== "deleted" &&
        parsed.action !== "banned" &&
        parsed.action !== "unbanned") ||
      typeof parsed.id !== "string" ||
      typeof parsed.at !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("[live] failed to parse content payload:", error);
    return null;
  }
};

export function useContentRealtime() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    const eventSource = new EventSource("/api/v1/live/stream", {
      withCredentials: true,
    });

    const handleContentEvent = (event: Event) => {
      if (!(event instanceof MessageEvent)) return;
      const payload = parseLivePayload(event.data);
      if (!payload) return;

      if (payload.kind === "story") {
        queryClient.invalidateQueries({ queryKey: ["stories"] });
        queryClient.invalidateQueries({ queryKey: ["stories", payload.id] });
        return;
      }

      if (payload.kind === "poem") {
        queryClient.invalidateQueries({ queryKey: ["poems"] });
        queryClient.invalidateQueries({ queryKey: ["poems", payload.id] });
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["series"] });
      queryClient.invalidateQueries({ queryKey: ["series", payload.id] });
    };

    eventSource.addEventListener("content", handleContentEvent);
    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.removeEventListener("content", handleContentEvent);
      eventSource.close();
    };
  }, [isAuthenticated, queryClient]);
}

