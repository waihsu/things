import { useQuery } from "@tanstack/react-query";
import type { Series } from "./types";

type SeriesResponse = {
  series: Series;
};

async function fetchSeries(id: string): Promise<Series> {
  const response = await fetch(`/api/v1/series/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch series");
  }
  const data = (await response.json()) as SeriesResponse;
  return data.series;
}

export function useGetSerie(id: string) {
  return useQuery({
    queryKey: ["series", id],
    queryFn: () => fetchSeries(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}
