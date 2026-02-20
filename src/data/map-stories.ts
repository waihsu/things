// ===========================================
// mappedStories.ts
// ===========================================
import {
  initialStories,
  initialCategories,
  initialProfiles,
  initialLikes,
  initialComments,
} from "./initial-data";

export interface StoryItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  author: { name: string; avatar?: string | null };
  publishedAt: string;
  readTime: string;
  likes: number;
  comments: number;
  trending?: boolean;
  image?: string | null;
}

export const mappedStories: StoryItem[] = initialStories.map((story) => {
  const categoryNames = (story.categoryIds ?? [])
    .map((id) => initialCategories.find((c) => c.id === id)?.name)
    .filter((name): name is string => !!name);
  const category =
    categoryNames.length > 0 ? categoryNames.join(" • ") : "Unknown";
  const authorProfile = initialProfiles.find((p) => p.userId === story.userId);
  const likeCount = initialLikes.filter((l) => l.storyId === story.id).length;
  const commentCount = initialComments.filter(
    (c) => c.storyId === story.id,
  ).length;

  const words = story.summary ? story.summary.split(" ").length : 100;
  const readTime = `${Math.ceil(words / 200)} min read`;

  return {
    id: story.id,
    title: story.title,
    summary: story.summary || "", // ✅ here
    category,
    author: {
      name: authorProfile?.name || "Unknown",
      avatar: authorProfile?.avatarUrl || undefined,
    },
    publishedAt: story.createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    readTime,
    likes: likeCount,
    comments: commentCount,
    trending: story.readCount > 800,
    image: undefined,
  };
});
