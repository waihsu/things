import type { AppUser } from "@/src/server/types";
import { ServiceError } from "@/src/server/utils/service-error";
import { followsRepository } from "./follows.repository";

type FollowSummary = {
  user_id: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
};

const ensureUser = (user: AppUser | null): AppUser => {
  if (!user) {
    throw new ServiceError("Unauthorized", 401);
  }
  return user;
};

const normalizeUserId = (value: string) => value.trim();

const ensureTargetExists = async (targetUserId: string) => {
  const exists = await followsRepository.userExists(targetUserId);
  if (!exists) {
    throw new ServiceError("User not found", 404);
  }
};

export const followsService = {
  async getSummary(targetUserIdRaw: string, viewer: AppUser | null) {
    const targetUserId = normalizeUserId(targetUserIdRaw);
    if (!targetUserId) {
      throw new ServiceError("User id is required", 400);
    }

    await ensureTargetExists(targetUserId);
    const summary = await followsRepository.readSummary(
      targetUserId,
      viewer?.id ?? null,
    );

    return {
      user_id: targetUserId,
      ...summary,
    } satisfies FollowSummary;
  },

  async follow(targetUserIdRaw: string, viewer: AppUser | null) {
    const currentUser = ensureUser(viewer);
    const targetUserId = normalizeUserId(targetUserIdRaw);

    if (!targetUserId) {
      throw new ServiceError("User id is required", 400);
    }
    if (targetUserId === currentUser.id) {
      throw new ServiceError("You cannot follow yourself", 400);
    }

    await ensureTargetExists(targetUserId);
    await followsRepository.follow(currentUser.id, targetUserId);
    return this.getSummary(targetUserId, currentUser);
  },

  async unfollow(targetUserIdRaw: string, viewer: AppUser | null) {
    const currentUser = ensureUser(viewer);
    const targetUserId = normalizeUserId(targetUserIdRaw);

    if (!targetUserId) {
      throw new ServiceError("User id is required", 400);
    }
    if (targetUserId === currentUser.id) {
      throw new ServiceError("You cannot unfollow yourself", 400);
    }

    await ensureTargetExists(targetUserId);
    await followsRepository.unfollow(currentUser.id, targetUserId);
    return this.getSummary(targetUserId, currentUser);
  },
};
