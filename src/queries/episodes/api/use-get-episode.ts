import { useQuery } from "@tanstack/react-query";
import type { Episode } from "./types";

type EpisodeResponse = {
  episode: Episode;
};

async function fetchEpisode(id: string): Promise<Episode> {
  const response = await fetch(`/api/v1/episodes/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch episode");
  }
  const data = (await response.json()) as EpisodeResponse;
  return data.episode;
}

export function useGetEpisode(id: string) {
  return useQuery({
    queryKey: ["episodes", id],
    queryFn: () => fetchEpisode(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}
