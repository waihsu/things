import { useQuery } from "@tanstack/react-query";
import type { Episode } from "./types";

type EpisodesResponse = {
  episodes: Episode[];
};

async function fetchEpisodes(seriesId?: string): Promise<Episode[]> {
  const url = seriesId ? `/api/v1/episodes?series_id=${seriesId}` : "/api/v1/episodes";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch episodes");
  }
  const data = (await response.json()) as EpisodesResponse;
  return data.episodes;
}

export function useGetEpisodes(seriesId?: string) {
  return useQuery({
    queryKey: ["episodes", seriesId ?? "all"],
    queryFn: () => fetchEpisodes(seriesId),
    enabled: seriesId !== undefined ? !!seriesId : true,
    staleTime: 30_000,
  });
}
