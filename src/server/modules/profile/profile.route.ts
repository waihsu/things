import { Hono } from "hono";
import type { AppBindings } from "@/src/server/types";
import { profileController } from "./profile.controller";

const profileRoute = new Hono<AppBindings>()
  .get("/", profileController.getMyProfile)
  .get("/admin/users", profileController.getUsers)
  .post("/admin/users/:id/ban", profileController.banUser)
  .post("/admin/users/:id/unban", profileController.unbanUser)
  .get("/:handle", profileController.getPublicProfile)
  .put("/", profileController.update);

export default profileRoute;
