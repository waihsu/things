import { Hono } from "hono";
import type { AppBindings } from "@/src/server/types";
import { episodesController } from "./episodes.controller";

const episodesRoute = new Hono<AppBindings>()
  .get("/", episodesController.list)
  .get("/:id", episodesController.getById)
  .post("/", episodesController.create)
  .put("/:id", episodesController.update)
  .delete("/:id", episodesController.remove);

export default episodesRoute;
