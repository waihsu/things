export interface StoryItem {
  id: string;
  title: string;
  summary: string; // ✅ not null
  category: string;
  author: {
    name: string;
    avatar?: string | null;
    handle?: string;
    userId?: string;
    online?: boolean | null;
    lastSeenAt?: string | null;
  };
  publishedAt: string;
  readTime: string;
  likes: number;
  comments: number;
  liked?: boolean;
  trending?: boolean;
  image?: string | null;
}

export interface PoemItem {
  id: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatar?: string | null;
    handle?: string;
    userId?: string;
    online?: boolean | null;
    lastSeenAt?: string | null;
  };
  publishedAt: string;
  readCount: number;
  tags?: string[];
  categoryNames?: string[];
}
