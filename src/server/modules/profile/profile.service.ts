import type { AppUser } from "@/src/server/types";
import { hasColumn } from "@/src/server/utils/column-cache";
import {
  normalizeOptionalString,
  normalizeStringArray,
  normalizeUsername,
} from "@/src/server/utils/validation";
import { ServiceError } from "@/src/server/utils/service-error";
import { ensureAdminUser } from "@/src/server/utils/admin";
import {
  profileRepository,
  type AdminUserRow,
  type ProfileRow,
  type UserRow,
} from "./profile.repository";

type UpdateProfilePayload = {
  name?: string | null;
  username?: string | null;
  phone_number?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  urls?: string[] | null;
};

const ensureUser = (user: AppUser | null): AppUser => {
  if (!user) {
    throw new ServiceError("Unauthorized", 401);
  }
  return user;
};

const parseAdminUser = (row: AdminUserRow) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  username: row.username,
  image: row.image,
  role: row.role ?? "user",
  banned: Boolean(row.banned),
  created_at: row.created_at,
  updated_at: row.updated_at,
  stories_count: Number(row.stories_count ?? 0),
  poems_count: Number(row.poems_count ?? 0),
  series_count: Number(row.series_count ?? 0),
  total_reads: Number(row.total_reads ?? 0),
  total_comments: Number(row.total_comments ?? 0),
  last_active_at: row.last_active_at,
});

const toProfilePayload = (profile: ProfileRow) => ({
  id: profile.id,
  user_id: profile.user_id,
  name: profile.name,
  phone_number: profile.phone_number,
  street: profile.street,
  city: profile.city,
  state: profile.state,
  zip_code: profile.zip_code,
  country: profile.country,
  bio: profile.bio,
  avatar_url: profile.avatar_url,
  urls: profile.urls,
  created_at: profile.created_at,
  updated_at: profile.updated_at,
});

const buildEmptyProfile = (userRow: UserRow) => ({
  id: null,
  user_id: userRow.id,
  name: null,
  phone_number: null,
  street: null,
  city: null,
  state: null,
  zip_code: null,
  country: null,
  bio: null,
  avatar_url: null,
  urls: null,
  created_at: null,
  updated_at: null,
});

const loadStats = async (userId: string) => {
  const statsRow = await profileRepository.readStats(userId);
  let storyReads = 0;
  let seriesReads = 0;

  if (await hasColumn("short_stories", "read_count")) {
    storyReads = await profileRepository.readStoryViews(userId);
  }

  if (await hasColumn("series", "read_count")) {
    seriesReads = await profileRepository.readSeriesViews(userId);
  }

  return {
    stories_count: Number(statsRow.stories_count ?? 0),
    series_count: Number(statsRow.series_count ?? 0),
    episodes_count: Number(statsRow.episodes_count ?? 0),
    story_reads: storyReads,
    series_reads: seriesReads,
    total_reads: storyReads + seriesReads,
  };
};

export const profileService = {
  async getOwnProfile(user: AppUser | null) {
    const currentUser = ensureUser(user);
    const userRow = await profileRepository.findUserById(currentUser.id);

    if (!userRow) {
      throw new ServiceError("User not found", 404);
    }

    const profile = await profileRepository.findProfileByUserId(currentUser.id);
    if (!profile) {
      return {
        ...buildEmptyProfile(userRow),
        user: {
          id: userRow.id,
          name: userRow.name,
          email: userRow.email,
          image: userRow.image,
          username: userRow.username,
        },
      };
    }

    return {
      ...toProfilePayload(profile),
      user: {
        id: profile.user_id,
        name: profile.user_name,
        email: profile.user_email,
        image: profile.user_image,
        username: profile.user_username,
      },
    };
  },

  async getPublicProfile(handle: string) {
    if (!handle) {
      throw new ServiceError("Profile handle is required", 400);
    }

    const userRow = await profileRepository.findUserByHandle(handle);
    if (!userRow) {
      throw new ServiceError("User not found", 404);
    }

    const profile = await profileRepository.findProfileByUserId(userRow.id);
    const stats = await loadStats(userRow.id);

    if (!profile) {
      return {
        ...buildEmptyProfile({
          ...userRow,
          email: null,
        }),
        user: {
          id: userRow.id,
          name: userRow.name,
          image: userRow.image,
          username: userRow.username,
        },
        stats,
      };
    }

    return {
      ...toProfilePayload(profile),
      user: {
        id: profile.user_id,
        name: profile.user_name,
        image: profile.user_image,
        username: profile.user_username,
      },
      stats,
    };
  },

  async updateProfile(user: AppUser | null, payload: UpdateProfilePayload) {
    const currentUser = ensureUser(user);

    if (Object.prototype.hasOwnProperty.call(payload, "username")) {
      const normalizedUsername = normalizeUsername(payload.username);
      if (normalizedUsername && !/^[a-z0-9._-]{3,30}$/.test(normalizedUsername)) {
        throw new ServiceError(
          "Username must be 3-30 characters and only include letters, numbers, dots, underscores, or hyphens.",
          400,
        );
      }

      if (normalizedUsername) {
        const taken = await profileRepository.findUsernameTaken(
          normalizedUsername,
          currentUser.id,
        );
        if (taken) {
          throw new ServiceError("Username already taken.", 409);
        }
      }

      await profileRepository.updateUsername(currentUser.id, normalizedUsername);
    }

    const cleanedUrls = normalizeStringArray(payload.urls);
    const profile = await profileRepository.upsertProfile({
      id: crypto.randomUUID(),
      userId: currentUser.id,
      name: normalizeOptionalString(payload.name),
      phone_number: normalizeOptionalString(payload.phone_number),
      street: normalizeOptionalString(payload.street),
      city: normalizeOptionalString(payload.city),
      state: normalizeOptionalString(payload.state),
      zip_code: normalizeOptionalString(payload.zip_code),
      country: normalizeOptionalString(payload.country),
      bio: normalizeOptionalString(payload.bio),
      avatar_url: normalizeOptionalString(payload.avatar_url),
      urls: cleanedUrls.length ? JSON.stringify(cleanedUrls) : null,
    });

    const userRow = await profileRepository.findUserById(currentUser.id);
    if (!profile || !userRow) {
      throw new ServiceError("Failed to update profile", 500);
    }

    return {
      ...profile,
      user: {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        image: userRow.image,
        username: userRow.username,
      },
    };
  },

  async listUsersForAdmin(
    user: AppUser | null,
    input: { search?: string; limit?: number; offset?: number; sortBy?: string },
  ) {
    ensureAdminUser(user);

    const search = String(input.search || "").trim();
    const limit = Math.max(1, Math.min(Number(input.limit ?? 50) || 50, 100));
    const offset = Math.max(0, Number(input.offset ?? 0) || 0);
    const sortByRaw = String(input.sortBy || "recent");
    const sortBy =
      sortByRaw === "name" || sortByRaw === "activity" ? sortByRaw : "recent";

    const [totalCount, rows] = await Promise.all([
      profileRepository.countUsersForAdmin(search),
      profileRepository.listUsersForAdmin({ search, limit, offset, sortBy }),
    ]);

    const users = rows.map(parseAdminUser);
    const hasMore = offset + users.length < totalCount;

    return {
      users,
      total_count: totalCount,
      limit,
      offset,
      has_more: hasMore,
      next_offset: hasMore ? offset + limit : null,
    };
  },

  async banUser(user: AppUser | null, targetUserId: string, reason?: string) {
    const currentAdmin = ensureAdminUser(user);
    const normalizedTarget = String(targetUserId || "").trim();
    if (!normalizedTarget) {
      throw new ServiceError("User id is required.", 400);
    }

    if (currentAdmin.id === normalizedTarget) {
      throw new ServiceError("You cannot ban your own account.", 400);
    }

    const targetUser = await profileRepository.findUserById(normalizedTarget);
    if (!targetUser) {
      throw new ServiceError("User not found.", 404);
    }

    const updated = await profileRepository.updateUserBanStatus({
      userId: normalizedTarget,
      banned: true,
      reason: normalizeOptionalString(reason) ?? "Banned by admin",
      expiresAt: null,
    });

    if (!updated) {
      throw new ServiceError("User not found.", 404);
    }
  },

  async unbanUser(user: AppUser | null, targetUserId: string) {
    ensureAdminUser(user);
    const normalizedTarget = String(targetUserId || "").trim();
    if (!normalizedTarget) {
      throw new ServiceError("User id is required.", 400);
    }

    const updated = await profileRepository.updateUserBanStatus({
      userId: normalizedTarget,
      banned: false,
      reason: null,
      expiresAt: null,
    });

    if (!updated) {
      throw new ServiceError("User not found.", 404);
    }
  },
};
