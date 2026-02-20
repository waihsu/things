import { Hono } from "hono";
import type { AppBindings } from "@/src/server/types";
import { presenceController } from "./presence.controller";

const presenceRoute = new Hono<AppBindings>()
  .get("/", presenceController.list)
  .get("/stream", presenceController.stream)
  .get("/:userId", presenceController.getByUserId);

export default presenceRoute;
