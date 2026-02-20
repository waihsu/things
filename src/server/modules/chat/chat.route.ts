import { Hono } from "hono";
import type { AppBindings } from "@/src/server/types";
import { chatController } from "./chat.controller";

const chatRoute = new Hono<AppBindings>()
  .get("/", chatController.list)
  .get("/users", chatController.listUsers)
  .get("/conversations", chatController.listConversations)
  .get("/direct/:userId/messages", chatController.listDirectMessages);

export default chatRoute;
