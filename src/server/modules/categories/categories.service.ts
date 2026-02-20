import type { AppUser } from "@/src/server/types";
import { categoriesRepository } from "./categories.repository";

export const categoriesService = {
  async listCategories(user: AppUser | null) {
    if (!user) {
      return [];
    }

    return categoriesRepository.listActive();
  },
};
