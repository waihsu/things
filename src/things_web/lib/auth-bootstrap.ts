import { useAuthStore } from "@/src/store/use-auth-store";
import { authClient } from "./auth";

type SessionUser = {
  id: string;
  email: string;
  name?: string;
  image?: string;
};

const parseSessionUser = (value: unknown): SessionUser | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const session = value as { user?: unknown };
  if (!session.user || typeof session.user !== "object") {
    return null;
  }
  const user = session.user as {
    id?: unknown;
    email?: unknown;
    name?: unknown;
    image?: unknown;
  };
  if (typeof user.id !== "string" || typeof user.email !== "string") {
    return null;
  }
  return {
    id: user.id,
    email: user.email,
    name: typeof user.name === "string" ? user.name : undefined,
    image: typeof user.image === "string" ? user.image : undefined,
  };
};

export async function restoreSession() {
  const { setUser, setLoading } = useAuthStore.getState();

  try {
    const result = await authClient.getSession();
    const sessionUser = parseSessionUser((result as { data?: unknown } | null)?.data);

    if (sessionUser) {
      setUser(sessionUser);
    } else {
      setUser(null);
    }
  } finally {
    setLoading(false);
  }
}
