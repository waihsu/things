import { useQuery } from "@tanstack/react-query";
import type { Profile, ProfileApi } from "./types";
import { normalizeProfile } from "./types";

type ProfileResponse = {
  profile: ProfileApi;
};

async function fetchProfile(): Promise<Profile> {
  const response = await fetch("/api/v1/profile");
  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }
  const data = (await response.json()) as ProfileResponse;
  return normalizeProfile(data.profile);
}

export function useGetProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 30_000,
  });
}
