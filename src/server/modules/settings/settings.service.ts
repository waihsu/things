import type { AppUser } from "@/src/server/types";
import { ServiceError } from "@/src/server/utils/service-error";
import { settingsRepository, type SettingsInput, type SettingsRow } from "./settings.repository";

type SettingsPayload = {
  bioSnippet?: string | null;
  emailUpdates?: boolean;
  commentAlerts?: boolean;
  weeklyDigest?: boolean;
  readingFocus?: boolean;
  autoSave?: boolean;
  profileVisibility?: "public" | "members" | "private" | string;
  allowProfileDiscovery?: boolean;
};

const DEFAULT_SETTINGS: SettingsInput = {
  bio_snippet: null,
  email_updates: true,
  comment_alerts: true,
  weekly_digest: false,
  reading_focus: true,
  auto_save: true,
  profile_visibility: "public",
  allow_profile_discovery: true,
};

const PROFILE_VISIBILITY_VALUES = new Set(["public", "members", "private"]);

const ensureUser = (user: AppUser | null): AppUser => {
  if (!user) {
    throw new ServiceError("Unauthorized", 401);
  }
  return user;
};

const getAdminEmails = () =>
  [process.env.ADMIN_EMAIL, process.env.ADMIN_EMAILS]
    .filter((item): item is string => Boolean(item))
    .flatMap((item) => item.split(","))
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const isAdminUser = (user: AppUser) => {
  const role = (user as { role?: string }).role;
  if (role === "admin") {
    return true;
  }

  const email = String(user.email || "").toLowerCase();
  return getAdminEmails().includes(email);
};

const toSettings = (row: SettingsRow | null): SettingsInput => {
  if (!row) {
    return { ...DEFAULT_SETTINGS };
  }

  return {
    bio_snippet: row.bio_snippet,
    email_updates: row.email_updates,
    comment_alerts: row.comment_alerts,
    weekly_digest: row.weekly_digest,
    reading_focus: row.reading_focus,
    auto_save: row.auto_save,
    profile_visibility: PROFILE_VISIBILITY_VALUES.has(row.profile_visibility)
      ? (row.profile_visibility as SettingsInput["profile_visibility"])
      : "public",
    allow_profile_discovery: row.allow_profile_discovery,
  };
};

const sanitizeBioSnippet = (value: unknown, fallback: string | null) => {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > 280) {
    throw new ServiceError("Bio snippet cannot exceed 280 characters.", 400);
  }
  return trimmed;
};

export const settingsService = {
  async get(user: AppUser | null) {
    const currentUser = ensureUser(user);
    const row = await settingsRepository.findByUserId(currentUser.id);
    const settings = toSettings(row);
    return {
      settings: {
        bioSnippet: settings.bio_snippet ?? "",
        emailUpdates: settings.email_updates,
        commentAlerts: settings.comment_alerts,
        weeklyDigest: settings.weekly_digest,
        readingFocus: settings.reading_focus,
        autoSave: settings.auto_save,
        profileVisibility: settings.profile_visibility,
        allowProfileDiscovery: settings.allow_profile_discovery,
      },
      isAdmin: isAdminUser(currentUser),
    };
  },

  async update(user: AppUser | null, payload: SettingsPayload) {
    const currentUser = ensureUser(user);
    const existing = toSettings(await settingsRepository.findByUserId(currentUser.id));

    const next: SettingsInput = {
      bio_snippet: sanitizeBioSnippet(payload.bioSnippet, existing.bio_snippet),
      email_updates:
        typeof payload.emailUpdates === "boolean"
          ? payload.emailUpdates
          : existing.email_updates,
      comment_alerts:
        typeof payload.commentAlerts === "boolean"
          ? payload.commentAlerts
          : existing.comment_alerts,
      weekly_digest:
        typeof payload.weeklyDigest === "boolean"
          ? payload.weeklyDigest
          : existing.weekly_digest,
      reading_focus:
        typeof payload.readingFocus === "boolean"
          ? payload.readingFocus
          : existing.reading_focus,
      auto_save:
        typeof payload.autoSave === "boolean"
          ? payload.autoSave
          : existing.auto_save,
      profile_visibility: PROFILE_VISIBILITY_VALUES.has(
        String(payload.profileVisibility || ""),
      )
        ? (payload.profileVisibility as SettingsInput["profile_visibility"])
        : existing.profile_visibility,
      allow_profile_discovery:
        typeof payload.allowProfileDiscovery === "boolean"
          ? payload.allowProfileDiscovery
          : existing.allow_profile_discovery,
    };

    const updated = await settingsRepository.upsert(currentUser.id, next);
    if (!updated) {
      throw new ServiceError("Failed to update settings.", 500);
    }

    return {
      settings: {
        bioSnippet: updated.bio_snippet ?? "",
        emailUpdates: updated.email_updates,
        commentAlerts: updated.comment_alerts,
        weeklyDigest: updated.weekly_digest,
        readingFocus: updated.reading_focus,
        autoSave: updated.auto_save,
        profileVisibility: PROFILE_VISIBILITY_VALUES.has(updated.profile_visibility)
          ? (updated.profile_visibility as SettingsInput["profile_visibility"])
          : "public",
        allowProfileDiscovery: updated.allow_profile_discovery,
      },
      isAdmin: isAdminUser(currentUser),
    };
  },

  async importFakeData(user: AppUser | null) {
    const currentUser = ensureUser(user);
    if (!isAdminUser(currentUser)) {
      throw new ServiceError("Only admin users can import fake data.", 403);
    }

    return settingsRepository.importFakeData(currentUser.id);
  },
};

