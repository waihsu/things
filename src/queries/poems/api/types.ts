export type Poem = {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  user_id: string;
  read_count: number;
  created_at: string;
  updated_at: string;
  author_name: string | null;
  author_avatar: string | null;
  author_username: string | null;
  category_ids: string[];
  category_names: string[];
  tags: string[];
  is_banned: boolean;
  banned_at?: string | null;
  banned_reason?: string | null;
  author_bio?: string | null;
  author_urls?: string | null;
  author?: {
    id: string;
    name: string | null;
    avatar: string | null;
    bio?: string | null;
    urls?: string | null;
  };
};
