import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

type UsePoemsRealtimeOptions = {
  enabled?: boolean;
};

export function usePoemsRealtime(options?: UsePoemsRealtimeOptions) {
  const queryClient = useQueryClient();
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    const eventSource = new EventSource("/api/v1/poems/stream", {
      withCredentials: true,
    });

    const handlePoemEvent = () => {
      queryClient.invalidateQueries({ queryKey: ["poems"] });
    };

    eventSource.addEventListener("poem", handlePoemEvent);
    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.removeEventListener("poem", handlePoemEvent);
      eventSource.close();
    };
  }, [enabled, queryClient]);
}
