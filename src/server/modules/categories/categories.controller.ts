import type { Context } from "hono";
import type { AppBindings } from "@/src/server/types";
import { categoriesService } from "./categories.service";

export const categoriesController = {
  async list(c: Context<AppBindings>) {
    const categories = await categoriesService.listCategories(c.get("user"));
    return c.json({ categories });
  },
};
