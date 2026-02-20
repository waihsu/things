import { Hono } from "hono";
import type { AppBindings } from "@/src/server/types";
import { followsController } from "./follows.controller";

const followsRoute = new Hono<AppBindings>()
  .get("/:userId", followsController.summary)
  .post("/:userId", followsController.follow)
  .delete("/:userId", followsController.unfollow);

export default followsRoute;
