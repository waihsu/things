import { serve } from "bun";
import thingsWebIndex from "./src/things_web/index.html";
import adminIndex from "./src/admin/index.html";
import chatAppIndex from "./src/chat_app/index.html";

import api from "./src/server/api";
import {
  chatWebSocketHandlers,
  handleChatWebSocketUpgrade,
  type ChatSocketData,
} from "./src/server/modules/chat/chat.websocket";

const server = serve<ChatSocketData>({
  routes: {
    "/admin": adminIndex,
    "/admin/*": adminIndex,
    "/chat_app": chatAppIndex,
    "/chat_app/*": chatAppIndex,
    "/api/v1/chat/ws": (req: Request, server: any) =>
      handleChatWebSocketUpgrade(req, server),
    "/api/*": api.fetch,
    "/*": thingsWebIndex,
  },
  websocket: chatWebSocketHandlers,
  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

export default server;
console.log(`🚀 Server running at ${server.url}`);
