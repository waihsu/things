import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // baseURL: "http://localhost:8787", // backend
  // basePath: "/api/v1/auth", // backend auth route
});
