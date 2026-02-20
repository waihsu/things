import { Hono } from "hono";
import type { AppBindings } from "@/src/server/types";
import { storiesController } from "./stories.controller";

const storiesRoute = new Hono<AppBindings>()
  .get("/", storiesController.list)
  .get("/:id", storiesController.getById)
  .get("/:id/comments", storiesController.listComments)
  .post("/:id/comments", storiesController.addComment)
  .delete("/:id/comments/:commentId", storiesController.deleteComment)
  .post("/:id/like", storiesController.toggleLike)
  .post("/:id/read", storiesController.incrementRead)
  .post("/:id/ban", storiesController.ban)
  .post("/:id/unban", storiesController.unban)
  .post("/", storiesController.create)
  .put("/:id", storiesController.update)
  .delete("/:id", storiesController.remove);

export default storiesRoute;
