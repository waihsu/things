import { Hono } from "hono";
import type { AppBindings } from "@/src/server/types";
import { categoriesController } from "./categories.controller";

const categoriesRoute = new Hono<AppBindings>().get(
  "/",
  categoriesController.list,
);

export default categoriesRoute;
