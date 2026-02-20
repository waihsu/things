import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, bearer, magicLink } from "better-auth/plugins";

import { expo } from "@better-auth/expo";
import { db } from "@/src/db/http";
import { account, jwks, session, user, verification } from "@/src/db/schema-private";

const normalizeOrigin = (value: string) => value.trim().replace(/\/+$/, "");

const buildTrustedOrigins = () => {
  const origins = new Set<string>(["com.waihsu1999.camera://"]);
  const raw = [process.env.BETTER_AUTH_URL, process.env.CORS_ORIGINS]
    .filter(Boolean)
    .join(",");

  for (const token of raw.split(",")) {
    if (!token.trim()) continue;
    origins.add(normalizeOrigin(token));
  }

  if (process.env.NODE_ENV === "development") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }

  return Array.from(origins);
};

export const auth = betterAuth({
  // baseURL: " http://localhost:8787",
  // database: database,
  database: drizzleAdapter(db, {
    provider: "pg",
    camelCase: true,
    transaction: false,
    schema: {
      user,
      session,
      account,
      verification,
      jwks,
    },
  }),
  trustedOrigins: [
    ...buildTrustedOrigins(),
    // Development mode - Expo's exp:// scheme with local IP ranges
    ...(process.env.NODE_ENV === "development"
      ? ["exp://", "exp://**", "exp://192.168.*.*:*/**"]
      : []),
  ],
  plugins: [
    bearer(),

    // To support better-auth/client in React Native
    expo(),

    ...(process.env.NODE_ENV === "development"
      ? [
          magicLink({
            sendMagicLink: async ({ email, url }) => {
              console.info(
                "Magic link email would be sent to:",
                email,
                "with URL:",
                url,
              );
            },
          }),
        ]
      : []),

    admin(),
  ],
  emailAndPassword: {
    enabled: true, // Enable authentication using email and password.
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  logger: {
    level: process.env.NODE_ENV === "development" ? "debug" : "warn",
    log(level, message, ...args) {
      if (process.env.NODE_ENV === "development") {
        console.info(level, message, ...args);
      } else if (level === "error" || level === "warn") {
        console.error(level, message, ...args);
      }
    },
  },

  account: {
    accountLinking: {
      allowDifferentEmails: false,
    },
  },
});
