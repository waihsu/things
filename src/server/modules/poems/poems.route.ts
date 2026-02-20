import { Hono } from "hono";
import type { AppBindings } from "@/src/server/types";
import { poemsController } from "./poems.controller";

const poemsRoute = new Hono<AppBindings>()
  .get("/", poemsController.list)
  .get("/stream", poemsController.stream)
  .get("/:id", poemsController.getById)
  .post("/:id/read", poemsController.incrementRead)
  .post("/:id/ban", poemsController.ban)
  .post("/:id/unban", poemsController.unban)
  .post("/", poemsController.create)
  .put("/:id", poemsController.update)
  .delete("/:id", poemsController.remove);

export default poemsRoute;
