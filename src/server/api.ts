import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { auth } from "@/src/server/lib/auth";
import categoriesRoute from "./modules/categories/categories.route";
import storiesRoute from "./modules/stories/stories.route";
import seriesRoute from "./modules/series/series.route";
import episodesRoute from "./modules/episodes/episodes.route";
import profileRoute from "./modules/profile/profile.route";
import poemsRoute from "./modules/poems/poems.route";
import settingsRoute from "./modules/settings/settings.route";
import presenceRoute from "./modules/presence/presence.route";
import chatRoute from "./modules/chat/chat.route";
import followsRoute from "./modules/follows/follows.route";
import liveRoute from "./modules/live/live.route";
import { handleWorkerChatWebSocketUpgrade } from "./modules/chat/chat.websocket-worker";
import { ChatRoomDurableObject } from "./modules/chat/chat-room.durable-object";
import { attachSessionMiddleware } from "./middlewares/session";
import type { AppBindings } from "./types";

const normalizeOrigin = (value: string) => value.trim().replace(/\/+$/, "");

const buildAllowedOrigins = () => {
  const origins = new Set<string>();
  const raw = process.env.CORS_ORIGINS ?? process.env.BETTER_AUTH_URL ?? "";
  for (const token of raw.split(",")) {
    if (!token.trim()) continue;
    origins.add(normalizeOrigin(token));
  }

  if (process.env.NODE_ENV === "development") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }

  return origins;
};

const allowedOrigins = buildAllowedOrigins();

const resolveSpaEntrypointCandidates = (pathname: string) => {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return ["/admin/index.html", "/src/admin/index.html"];
  }
  if (pathname === "/chat_app" || pathname.startsWith("/chat_app/")) {
    return ["/chat_app/index.html", "/src/chat_app/index.html"];
  }
  return [
    "/index.html",
    "/src/things_web/index.html",
  ];
};

const serveStaticWithPrefixFallback = async (
  request: Request,
  pathname: string,
  env: AppBindings["Bindings"],
) => {
  const assets = env.ASSETS;
  if (!assets) {
    return new Response("ASSETS binding is missing", { status: 500 });
  }

  const isRedirect = (status: number) => status >= 300 && status < 400;
  const isSuccess = (status: number) => status >= 200 && status < 300;

  const acceptHeader = request.headers.get("accept") ?? "";
  const requestsHtml = acceptHeader.includes("text/html");
  const looksLikeAssetFile = /\.[a-z0-9]+$/i.test(pathname);

  // For SPA document routes (/chat_app/*, /admin/*, /...), prefer explicit
  // entrypoints first instead of Cloudflare's default SPA fallback target.
  if (!looksLikeAssetFile) {
    const entrypointCandidates = resolveSpaEntrypointCandidates(pathname);
    for (const entrypointPath of entrypointCandidates) {
      const entrypointUrl = new URL(request.url);
      entrypointUrl.pathname = entrypointPath;
      entrypointUrl.search = "";

      const response = await assets.fetch(
        new Request(entrypointUrl.toString(), request),
      );
      if (isSuccess(response.status)) {
        return response;
      }

      if (isRedirect(response.status)) {
        const location = response.headers.get("location");
        if (!location) continue;
        const redirectedUrl = new URL(location, entrypointUrl);
        const redirectedResponse = await assets.fetch(
          new Request(redirectedUrl.toString(), request),
        );
        if (isSuccess(redirectedResponse.status)) {
          return redirectedResponse;
        }
      }
    }
  }

  const assetResponse = await assets.fetch(request);
  if (!isRedirect(assetResponse.status) && assetResponse.status !== 404) {
    return assetResponse;
  }
  if (looksLikeAssetFile && !requestsHtml) {
    return assetResponse;
  }

  return assetResponse;
};

const resolveCorsOrigin = (origin?: string | null) => {
  if (!origin) {
    return undefined;
  }

  const normalized = normalizeOrigin(origin);
  return allowedOrigins.has(normalized) ? origin : undefined;
};

const apiV1 = new Hono<AppBindings>()
  .use("*", attachSessionMiddleware)
  .route("/categories", categoriesRoute)
  .route("/stories", storiesRoute)
  .route("/series", seriesRoute)
  .route("/episodes", episodesRoute)
  .route("/profile", profileRoute)
  .route("/presence", presenceRoute)
  .route("/chat", chatRoute)
  .route("/follows", followsRoute)
  .route("/live", liveRoute)
  .route("/poems", poemsRoute)
  .route("/settings", settingsRoute);

const api = new Hono<AppBindings>()
  .basePath("/api")
  .get("/v1/chat/ws", async (c) =>
    handleWorkerChatWebSocketUpgrade(c.req.raw, c.env),
  )
  .use(
    cors({
      origin: (origin) => resolveCorsOrigin(origin) ?? null,
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  )
  .use(logger())
  .get("/healthz", (c) => c.json({ ok: true, uptime: process.uptime() }))
  .all("/auth/*", (c) => auth.handler(c.req.raw))
  .route("/v1", apiV1)
  .notFound((c) => {
    if (c.req.path.startsWith("/api/")) {
      return c.json({ message: "Not Found" }, 404);
    }

    if (c.req.method !== "GET" && c.req.method !== "HEAD") {
      return c.json({ message: "Not Found" }, 404);
    }

    if (c.req.path === "/things_web" || c.req.path.startsWith("/things_web/")) {
      const redirectedPath = c.req.path.slice("/things_web".length) || "/";
      const redirectUrl = new URL(c.req.url);
      redirectUrl.pathname = redirectedPath;
      return c.redirect(redirectUrl.toString(), 302);
    }

    return serveStaticWithPrefixFallback(c.req.raw, c.req.path, c.env);
  })
  .onError(async (error, c) => {
    if (error instanceof HTTPException) {
      return c.json({ message: error.message }, error.status);
    }
    if (
      (c.req.method === "GET" || c.req.method === "HEAD") &&
      !c.req.path.startsWith("/api/")
    ) {
      try {
        return await serveStaticWithPrefixFallback(c.req.raw, c.req.path, c.env);
      } catch (assetError) {
        console.error("[api] static fallback failed:", assetError);
      }
    }
    console.error("[api] unhandled error:", error);
    return c.json({ message: "Internal Server Error" }, 500);
  });

export default api;
export { ChatRoomDurableObject };
