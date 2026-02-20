import { Hono } from "hono";
import type { AppBindings } from "@/src/server/types";
import { seriesController } from "./series.controller";

const seriesRoute = new Hono<AppBindings>()
  .get("/", seriesController.list)
  .get("/:id", seriesController.getById)
  .get("/:id/comments", seriesController.listComments)
  .post("/:id/comments", seriesController.addComment)
  .delete("/:id/comments/:commentId", seriesController.deleteComment)
  .post("/:id/like", seriesController.toggleLike)
  .post("/:id/read", seriesController.incrementRead)
  .post("/:id/ban", seriesController.ban)
  .post("/:id/unban", seriesController.unban)
  .post("/", seriesController.create)
  .put("/:id", seriesController.update)
  .delete("/:id", seriesController.remove);

export default seriesRoute;
