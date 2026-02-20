import { Hono } from "hono";
import type { AppBindings } from "@/src/server/types";
import { settingsController } from "./settings.controller";

const settingsRoute = new Hono<AppBindings>()
  .get("/", settingsController.get)
  .put("/", settingsController.update)
  .post("/import-fake-data", settingsController.importFakeData);

export default settingsRoute;

