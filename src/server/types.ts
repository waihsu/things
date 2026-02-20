import type { auth } from "./lib/auth";

export type AppBindings = {
  Bindings: {
    ASSETS?: {
      fetch: (request: Request | string | URL) => Promise<Response>;
    };
    CHAT_ROOM?: {
      idFromName: (name: string) => unknown;
      get: (id: unknown) => {
        fetch: (request: Request) => Promise<Response>;
      };
    };
  };
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

export type AppUser = NonNullable<AppBindings["Variables"]["user"]>;
