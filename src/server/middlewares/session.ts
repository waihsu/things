import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { auth } from "@/src/server/lib/auth";
import type { AppBindings } from "@/src/server/types";

const PUBLIC_PROFILE_PREFIX = "/api/v1/profile/";
const PUBLIC_PRESENCE_PREFIX = "/api/v1/presence";
const PUBLIC_FOLLOWS_PREFIX = "/api/v1/follows/";

const isBannedUser = (user: unknown) => {
  if (!user || typeof user !== "object") {
    return false;
  }
  return (user as { banned?: unknown }).banned === true;
};

const isPublicProfilePath = (path: string, method: string) => {
  if (method !== "GET") {
    return false;
  }

  if (!path.startsWith(PUBLIC_PROFILE_PREFIX)) {
    return false;
  }

  if (
    path === "/api/v1/profile/admin/users" ||
    path === "/api/v1/profile/admin/users/" ||
    path.startsWith("/api/v1/profile/admin/")
  ) {
    return false;
  }

  return path !== "/api/v1/profile" && path !== "/api/v1/profile/";
};

const isPublicPresencePath = (path: string, method: string) => {
  if (method !== "GET") {
    return false;
  }

  if (path === "/api/v1/presence") {
    return true;
  }

  if (!path.startsWith(`${PUBLIC_PRESENCE_PREFIX}/`)) {
    return false;
  }

  return path !== "/api/v1/presence/stream";
};

const isPublicFollowPath = (path: string, method: string) => {
  if (method !== "GET") {
    return false;
  }
  return path.startsWith(PUBLIC_FOLLOWS_PREFIX);
};

export const attachSessionMiddleware: MiddlewareHandler<AppBindings> = async (
  c,
  next,
) => {
  if (
    isPublicProfilePath(c.req.path, c.req.method) ||
    isPublicPresencePath(c.req.path, c.req.method) ||
    isPublicFollowPath(c.req.path, c.req.method)
  ) {
    try {
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      if (session?.user && isBannedUser(session.user)) {
        c.set("user", null);
        c.set("session", null);
      } else {
        c.set("user", session?.user ?? null);
        c.set("session", session?.session ?? null);
      }
    } catch {
      c.set("user", null);
      c.set("session", null);
    }
    await next();
    return;
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  if (isBannedUser(session.user)) {
    throw new HTTPException(403, { message: "Account is banned" });
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
};
