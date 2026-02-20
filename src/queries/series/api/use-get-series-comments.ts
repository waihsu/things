import { useQuery } from "@tanstack/react-query";

export type SeriesComment = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
};

async function fetchSeriesComments(seriesId: string): Promise<SeriesComment[]> {
  const response = await fetch(`/api/v1/series/${seriesId}/comments`);
  if (!response.ok) {
    throw new Error("Failed to fetch comments");
  }
  const data = (await response.json()) as { comments: SeriesComment[] };
  return data.comments;
}

export function useGetSeriesComments(seriesId: string) {
  return useQuery({
    queryKey: ["series-comments", seriesId],
    queryFn: () => fetchSeriesComments(seriesId),
    enabled: !!seriesId,
  });
}
