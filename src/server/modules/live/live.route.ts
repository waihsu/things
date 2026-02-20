import { Hono } from "hono";
import type { AppBindings } from "@/src/server/types";
import { liveController } from "./live.controller";

const liveRoute = new Hono<AppBindings>().get("/stream", liveController.stream);

export default liveRoute;

