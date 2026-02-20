import { useQuery } from "@tanstack/react-query";

export type StoryComment = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
};

async function fetchStoryComments(storyId: string): Promise<StoryComment[]> {
  const response = await fetch(`/api/v1/stories/${storyId}/comments`);
  if (!response.ok) {
    throw new Error("Failed to fetch comments");
  }
  const data = (await response.json()) as { comments: StoryComment[] };
  return data.comments;
}

export function useGetStoryComments(storyId: string) {
  return useQuery({
    queryKey: ["story-comments", storyId],
    queryFn: () => fetchStoryComments(storyId),
    enabled: !!storyId,
  });
}
