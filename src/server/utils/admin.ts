import type { AppUser } from "@/src/server/types";
import { ServiceError } from "@/src/server/utils/service-error";

const getAdminEmails = () =>
  [process.env.ADMIN_EMAIL, process.env.ADMIN_EMAILS]
    .filter((item): item is string => Boolean(item))
    .flatMap((item) => item.split(","))
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

export const isAdminUser = (user: AppUser | null) => {
  if (!user) {
    return false;
  }

  const role = (user as { role?: string }).role;
  if (role === "admin") {
    return true;
  }

  const email = String(user.email || "").toLowerCase();
  return getAdminEmails().includes(email);
};

export const ensureAdminUser = (user: AppUser | null): AppUser => {
  if (!user) {
    throw new ServiceError("Unauthorized", 401);
  }

  if (!isAdminUser(user)) {
    throw new ServiceError("Admin access required", 403);
  }

  return user;
};
