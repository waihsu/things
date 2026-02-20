import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PresenceByUserId, PresenceStatus } from "./types";
import { usePresenceStore } from "@/src/store/use-presence-store";

type PresenceResponse = {
  presence: PresenceStatus[];
};

const normalizeUserIds = (userIds: string[]) => {
  const deduped = new Set<string>();
  for (const rawId of userIds) {
    const id = rawId.trim();
    if (!id) continue;
    deduped.add(id);
    if (deduped.size >= 80) break;
  }
  return [...deduped].sort();
};

const fetchPresence = async (userIds: string[]) => {
  if (!userIds.length) return [] as PresenceStatus[];

  const params = new URLSearchParams();
  params.set("ids", userIds.join(","));

  const response = await fetch(`/api/v1/presence?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch presence");
  }

  const data = (await response.json()) as PresenceResponse;
  return data.presence ?? [];
};

export function useGetPresence(userIds: string[]) {
  const normalizedIds = useMemo(() => normalizeUserIds(userIds), [userIds]);
  const setStatuses = usePresenceStore((state) => state.setStatuses);
  const statusByUserId = usePresenceStore((state) => state.statusByUserId);

  const query = useQuery({
    queryKey: ["presence", "bulk", normalizedIds.join(",")],
    queryFn: async () => {
      const presence = await fetchPresence(normalizedIds);
      setStatuses(presence);
      return presence;
    },
    enabled: normalizedIds.length > 0,
    staleTime: 15_000,
    gcTime: 60_000,
  });

  const presenceByUserId = useMemo<PresenceByUserId>(() => {
    const byId: PresenceByUserId = {};
    for (const userId of normalizedIds) {
      byId[userId] = statusByUserId[userId];
    }
    return byId;
  }, [normalizedIds, statusByUserId]);

  return {
    ...query,
    presenceByUserId,
  };
}
