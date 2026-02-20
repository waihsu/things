"use client";

import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useOutletContext,
} from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  Brush,
  CheckCircle2,
  Database,
  Lock,
  LogOut,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/src/store/use-auth-store";
import { useGetSettings } from "@/src/queries/settings/api/use-get-settings";
import { useImportFakeData } from "@/src/queries/settings/api/use-import-fake-data";
import { useUpdateSettings } from "@/src/queries/settings/api/use-update-settings";
import type { Settings } from "@/src/queries/settings/api/types";

import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

const DEFAULT_SETTINGS: Settings = {
  bioSnippet: "",
  emailUpdates: true,
  commentAlerts: true,
  weeklyDigest: false,
  readingFocus: true,
  autoSave: true,
  profileVisibility: "public",
  allowProfileDiscovery: true,
};

type SettingsWorkspace = {
  user: ReturnType<typeof useAuthStore>["user"];
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  hasUnsavedChanges: boolean;
  isAdmin: boolean;
  saveSettings: () => void;
  savePending: boolean;
  importFakeData: () => void;
  importPending: boolean;
  logout: () => void;
};

export const SETTINGS_SECTIONS = [
  { path: "account", label: "Account", icon: UserRound },
  { path: "experience", label: "Experience", icon: Brush },
  { path: "notifications", label: "Notifications", icon: Bell },
  { path: "security", label: "Security", icon: ShieldCheck },
  { path: "privacy", label: "Privacy", icon: Lock },
] as const;

export default function SettingsLayout() {
  const shouldReduceMotion = useReducedMotion();
  const { user, logout } = useAuthStore();
  const defaultChatAppHref =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
      ? "/chat_app/chat"
      : "https://chat.hsuwai.space/chat";
  const chatAppHref =
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      ?.VITE_CHAT_APP_URL || defaultChatAppHref;
  const settingsQuery = useGetSettings();
  const updateSettings = useUpdateSettings();
  const importFakeDataMutation = useImportFakeData();

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loadedSettings, setLoadedSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (settingsQuery.data?.settings) {
      setSettings(settingsQuery.data.settings);
      setLoadedSettings(settingsQuery.data.settings);
    }
  }, [settingsQuery.data]);

  const displayName = user?.name || "Writer";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(loadedSettings),
    [loadedSettings, settings],
  );

  const saveSettings = () => {
    updateSettings.mutate(settings, {
      onSuccess: () => {
        setLoadedSettings(settings);
        toast.success("Preferences saved.");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to save settings.");
      },
    });
  };

  const importFakeData = () => {
    importFakeDataMutation.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(
          `Imported ${data.result.stories} stories, ${data.result.poems} poems, ${data.result.series} series.`,
        );
      },
      onError: (error) => {
        toast.error(error.message || "Failed to import fake data.");
      },
    });
  };

  if (settingsQuery.isLoading) {
    return (
      <div className="w-full px-3 py-12 sm:px-4 md:px-6 md:py-14 xl:px-8">
        <div className="premium-panel w-full rounded-3xl p-8 text-center text-muted-foreground">
          Loading settings...
        </div>
      </div>
    );
  }

  const isAdmin = Boolean(settingsQuery.data?.isAdmin);
  const sections = isAdmin
    ? [...SETTINGS_SECTIONS, { path: "admin", label: "Admin", icon: Database }]
    : SETTINGS_SECTIONS;

  const workspace: SettingsWorkspace = {
    user,
    settings,
    setSettings,
    hasUnsavedChanges,
    isAdmin,
    saveSettings,
    savePending: updateSettings.isPending,
    importFakeData,
    importPending: importFakeDataMutation.isPending,
    logout,
  };

  return (
    <div className="relative w-full text-foreground">
      <div className="flex w-full flex-col gap-6 px-3 py-2 sm:px-4 md:gap-8 md:px-6 xl:px-8">
        <motion.header
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="premium-panel rounded-3xl p-5 md:p-7"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-border/70 bg-card/90 p-2">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={user?.image ?? undefined} alt={displayName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </div>
              <div>
                <p className="premium-muted text-xs uppercase tracking-[0.35em]">
                  Settings Center
                </p>
                <h1 className="mt-2 text-3xl tracking-wide md:text-4xl">
                  Account Preferences
                </h1>
                <p className="premium-muted mt-2 text-sm">
                  Settings now use dedicated routes for cleaner navigation.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={saveSettings}
                disabled={updateSettings.isPending}
                className="bg-brand text-brand-ink font-semibold shadow-[0_12px_32px_rgba(196,153,79,0.34)] hover:bg-brand-soft"
              >
                {updateSettings.isPending ? "Saving..." : "Save changes"}
              </Button>
              <Button
                variant="outline"
                className="border-border/70 bg-card/75 text-foreground/80 hover:bg-foreground/6 hover:text-foreground"
                asChild
              >
                <Link to="/profile">Back to profile</Link>
              </Button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                hasUnsavedChanges
                  ? "border-brand/45 bg-brand/15 text-brand-strong"
                  : "border-emerald-500/35 bg-emerald-500/12 text-emerald-500 dark:text-emerald-400"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {hasUnsavedChanges ? "Unsaved changes" : "Everything saved"}
            </span>
            <span className="premium-muted text-xs">
              Signed in as {user?.email ?? "unknown@email.com"}
            </span>
          </div>
        </motion.header>

        <div className="premium-scroll flex gap-2 overflow-x-auto pb-1 xl:hidden">
          {sections.map((section) => (
            <NavLink
              key={section.path}
              to={section.path}
              className={({ isActive }) =>
                `rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.2em] transition ${
                  isActive
                    ? "border-brand/45 bg-brand/15 text-brand-strong"
                    : "border-border/70 bg-card/80 text-foreground/80 hover:bg-foreground/6 hover:text-foreground"
                }`
              }
            >
              {section.label}
            </NavLink>
          ))}
        </div>

        <section className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_300px]">
          <aside className="hidden xl:block">
            <div className="premium-panel sticky top-24 rounded-2xl p-3">
              <p className="premium-muted px-2 pb-2 text-xs uppercase tracking-[0.24em]">
                Sections
              </p>
              <div className="space-y-1">
                {sections.map((section) => (
                  <NavLink
                    key={section.path}
                    to={section.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                        isActive
                          ? "border border-brand/40 bg-brand/14 text-brand-strong"
                          : "text-foreground/80 hover:bg-foreground/6 hover:text-foreground"
                      }`
                    }
                  >
                    <section.icon className="h-4 w-4" />
                    {section.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <Outlet context={workspace} />
          </div>

          <aside className="space-y-6">
            <Card className="premium-panel sticky top-24 gap-0 rounded-3xl py-0">
              <CardHeader className="border-b border-border/70 py-5">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="h-5 w-5 text-brand" />
                  Control Panel
                </CardTitle>
                <CardDescription>Quick actions for this account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 py-6">
                <Button
                  onClick={saveSettings}
                  disabled={updateSettings.isPending}
                  className="w-full bg-brand text-brand-ink font-semibold shadow-[0_12px_30px_rgba(196,153,79,0.32)] hover:bg-brand-soft"
                >
                  {updateSettings.isPending ? "Saving..." : "Save all changes"}
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="w-full border-border/70 bg-card/70 text-foreground/85 hover:bg-foreground/6 hover:text-foreground"
                >
                  <Link to="/profile">Open profile</Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="w-full border-border/70 bg-card/70 text-foreground/85 hover:bg-foreground/6 hover:text-foreground"
                >
                  {chatAppHref.startsWith("http") ? (
                    <a href={chatAppHref}>Open chat app</a>
                  ) : (
                    <Link to={chatAppHref}>Open chat app</Link>
                  )}
                </Button>
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">Session</p>
                  <p className="premium-muted mt-1 text-xs">
                    Use sign out when this device is shared.
                  </p>
                  <Button variant="destructive" className="mt-3 w-full" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </div>
  );
}

export function useSettingsWorkspace() {
  return useOutletContext<SettingsWorkspace>();
}
