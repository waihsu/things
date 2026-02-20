export type ProfileUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  username: string | null;
};

export type ProfileApi = {
  id: string | null;
  user_id: string;
  name: string | null;
  username: string | null;
  phone_number: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  bio: string | null;
  avatar_url: string | null;
  urls: string | null;
  created_at: string | null;
  updated_at: string | null;
  user: ProfileUser;
};

export type Profile = Omit<ProfileApi, "urls"> & {
  urls: string[];
};

export type PublicProfileUser = {
  id: string;
  name: string | null;
  image: string | null;
  username: string | null;
};

export type PublicProfileStats = {
  stories_count: number;
  series_count: number;
  episodes_count: number;
  story_reads: number;
  series_reads: number;
  total_reads: number;
};

export type PublicProfileApi = Omit<ProfileApi, "user"> & {
  user: PublicProfileUser;
  stats: PublicProfileStats;
};

export type PublicProfile = Omit<PublicProfileApi, "urls"> & {
  urls: string[];
};

export type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  image: string | null;
  role: string;
  banned: boolean;
  created_at: string | null;
  updated_at: string | null;
  stories_count: number;
  poems_count: number;
  series_count: number;
  total_reads: number;
  total_comments: number;
  last_active_at: string | null;
};

const parseUrls = (value: string | null | undefined): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch (error) {
    console.warn("Failed to parse profile urls", error);
  }
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const normalizeUrls = <T extends { urls: string | null }>(
  profile: T,
): Omit<T, "urls"> & { urls: string[] } => {
  return {
    ...profile,
    urls: parseUrls(profile.urls),
  };
};

export const normalizeProfile = (profile: ProfileApi): Profile =>
  normalizeUrls(profile);

export const normalizePublicProfile = (
  profile: PublicProfileApi,
): PublicProfile => normalizeUrls(profile);
