import { useQuery } from "@tanstack/react-query";
import type { PublicProfile, PublicProfileApi } from "./types";
import { normalizePublicProfile } from "./types";

type PublicProfileResponse = {
  profile: PublicProfileApi;
};

async function fetchPublicProfile(handle: string): Promise<PublicProfile> {
  const response = await fetch(`/api/v1/profile/${handle}`);
  if (!response.ok) {
    throw new Error("Failed to fetch public profile");
  }
  const data = (await response.json()) as PublicProfileResponse;
  return normalizePublicProfile(data.profile);
}

export function useGetPublicProfile(handle: string) {
  return useQuery({
    queryKey: ["profile", "public", handle],
    queryFn: () => fetchPublicProfile(handle),
    enabled: !!handle,
    staleTime: 30_000,
  });
}
