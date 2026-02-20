import type { AppUser } from "@/src/server/types";
import { isNonEmptyString } from "@/src/server/utils/validation";
import { ServiceError } from "@/src/server/utils/service-error";
import { episodesRepository } from "./episodes.repository";

type CreateEpisodeInput = {
  name?: string;
  paragraph?: string;
  order?: number;
  series_id?: string;
};

type UpdateEpisodeInput = {
  name?: string;
  paragraph?: string;
  order?: number;
};

const ensureUser = (user: AppUser | null): AppUser => {
  if (!user) {
    throw new ServiceError("Unauthorized", 401);
  }
  return user;
};

export const episodesService = {
  async list(user: AppUser | null, seriesId?: string) {
    ensureUser(user);
    return episodesRepository.list(seriesId);
  },

  async findOne(user: AppUser | null, id: string) {
    ensureUser(user);
    const episode = await episodesRepository.findById(id);
    if (!episode) {
      throw new ServiceError("Episode not found", 404);
    }
    return episode;
  },

  async create(user: AppUser | null, input: CreateEpisodeInput) {
    const currentUser = ensureUser(user);
    if (
      !isNonEmptyString(input.name) ||
      !isNonEmptyString(input.paragraph) ||
      !isNonEmptyString(input.series_id)
    ) {
      throw new ServiceError("Invalid payload", 400);
    }

    const owner = await episodesRepository.findSeriesOwner(input.series_id);
    if (!owner || owner.user_id !== currentUser.id) {
      throw new ServiceError("Forbidden", 403);
    }

    const id = crypto.randomUUID();
    await episodesRepository.create({
      id,
      name: input.name,
      seriesId: input.series_id,
      paragraph: input.paragraph,
      order: input.order ?? 1,
    });
    return { id };
  },

  async update(user: AppUser | null, id: string, input: UpdateEpisodeInput) {
    const currentUser = ensureUser(user);
    if (!isNonEmptyString(input.name) || !isNonEmptyString(input.paragraph)) {
      throw new ServiceError("Invalid payload", 400);
    }

    const owner = await episodesRepository.findEpisodeOwner(id);
    if (!owner || owner.user_id !== currentUser.id) {
      throw new ServiceError("Forbidden", 403);
    }

    await episodesRepository.update({
      id,
      name: input.name,
      paragraph: input.paragraph,
      order: input.order ?? 1,
    });
  },

  async remove(user: AppUser | null, id: string) {
    const currentUser = ensureUser(user);
    const owner = await episodesRepository.findEpisodeOwner(id);
    if (!owner || owner.user_id !== currentUser.id) {
      throw new ServiceError("Forbidden", 403);
    }
    await episodesRepository.remove(id);
  },
};
