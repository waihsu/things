"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  Brush,
  Database,
  Lock,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/src/store/use-auth-store";
import { ModeToggle } from "../components/mode-toggle";
import { useGetSettings } from "@/src/queries/settings/api/use-get-settings";
import { useImportFakeData } from "@/src/queries/settings/api/use-import-fake-data";
import { useUpdateSettings } from "@/src/queries/settings/api/use-update-settings";
import type { ProfileVisibility, Settings } from "@/src/queries/settings/api/types";

import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";

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

const VISIBILITY_OPTIONS: Array<{ value: ProfileVisibility; label: string }> = [
  { value: "public", label: "Public" },
  { value: "members", label: "Members" },
  { value: "private", label: "Private" },
];

const readErrorMessage = async (response: Response, fallback: string) => {
  let message = fallback;
  try {
    const data = (await response.json()) as { message?: string };
    if (data?.message) {
      message = data.message;
    }
  } catch {
    // ignore parse errors
  }
  return message;
};

export default function SettingsPage() {
  const shouldReduceMotion = useReducedMotion();
  const { user, logout } = useAuthStore();
  const settingsQuery = useGetSettings();
  const updateSettings = useUpdateSettings();
  const importFakeData = useImportFakeData();

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  useEffect(() => {
    if (settingsQuery.data?.settings) {
      setSettings(settingsQuery.data.settings);
    }
  }, [settingsQuery.data]);

  const displayName = user?.name || "Writer";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSave = () => {
    updateSettings.mutate(settings, {
      onSuccess: () => {
        toast.success("Preferences saved.");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to save settings.");
      },
    });
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setPasswordSubmitting(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          revokeOtherSessions,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to change password."),
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setRevokeOtherSessions(false);
      toast.success("Password updated successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password.",
      );
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleImportFakeData = () => {
    importFakeData.mutate(undefined, {
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
      <div className="min-h-screen px-6 py-14">
        <div className="mx-auto max-w-4xl rounded-3xl border border-border/60 bg-card/75 p-8 text-center text-muted-foreground">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(243,213,149,0.2),transparent_45%),radial-gradient(circle_at_82%_6%,rgba(109,213,181,0.16),transparent_40%),linear-gradient(180deg,rgba(12,14,20,0.92),rgba(13,16,24,0.95)_40%,rgba(8,10,15,0.98))] dark:opacity-100 opacity-40" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(0deg,rgba(0,0,0,0.18)_1px,transparent_1px)] [background-size:100%_32px]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
        <motion.header
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.35)] backdrop-blur-sm md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-2 shadow-[0_15px_30px_rgba(0,0,0,0.25)]">
              <Avatar className="h-14 w-14">
                <AvatarImage src={user?.image} alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                Studio Settings
              </p>
              <h1 className="mt-2 text-3xl font-[var(--font-editorial)] tracking-wide">
                Preferences
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Tune the experience for {displayName}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="bg-brand text-brand-ink font-semibold shadow-[0_12px_30px_rgba(243,213,149,0.25)] hover:bg-brand-soft"
            >
              {updateSettings.isPending ? "Saving..." : "Save changes"}
            </Button>
            <Button
              variant="outline"
              className="border-border/60 text-foreground/80 hover:text-foreground hover:bg-foreground/5"
              asChild
            >
              <Link to="/profile">Back to profile</Link>
            </Button>
          </div>
        </motion.header>

        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <Card className="rounded-3xl border border-border/60 bg-card/85 shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-2xl font-[var(--font-editorial)]">
                  <UserRound className="h-5 w-5 text-brand" />
                  Account
                </CardTitle>
                <CardDescription>
                  Your account details and profile controls.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Email</p>
                  <Input
                    value={user?.email ?? ""}
                    readOnly
                    className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
                  />
                </div>
                <div className="grid gap-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Public bio snippet</p>
                  <Textarea
                    value={settings.bioSnippet}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, bioSnippet: event.target.value }))
                    }
                    maxLength={280}
                    placeholder="Add a short line that appears on your public profile."
                    className="min-h-[120px] rounded-2xl border-border/60 bg-background/60 px-4 py-3"
                  />
                  <p className="text-xs text-muted-foreground">
                    {settings.bioSnippet.length}/280
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    asChild
                    className="bg-brand text-brand-ink font-semibold shadow-[0_12px_30px_rgba(243,213,149,0.25)] hover:bg-brand-soft"
                  >
                    <Link to="/profile">Edit full profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-border/60 bg-card/85 shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-2xl font-[var(--font-editorial)]">
                  <Brush className="h-5 w-5 text-brand" />
                  Experience
                </CardTitle>
                <CardDescription>Personalize the writing studio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Theme</p>
                    <p className="text-xs text-muted-foreground">
                      Choose light, dark, or system.
                    </p>
                  </div>
                  <ModeToggle />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Reading focus</p>
                    <p className="text-xs text-muted-foreground">
                      Dim distractions while reading.
                    </p>
                  </div>
                  <Switch
                    checked={settings.readingFocus}
                    onCheckedChange={(value) =>
                      setSettings((prev) => ({ ...prev, readingFocus: value }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Autosave drafts</p>
                    <p className="text-xs text-muted-foreground">
                      Save while typing in the editor.
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoSave}
                    onCheckedChange={(value) =>
                      setSettings((prev) => ({ ...prev, autoSave: value }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-border/60 bg-card/85 shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-2xl font-[var(--font-editorial)]">
                  <Bell className="h-5 w-5 text-brand" />
                  Notifications
                </CardTitle>
                <CardDescription>Stay in the loop with your readers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Email updates</p>
                    <p className="text-xs text-muted-foreground">New likes, comments, and follows.</p>
                  </div>
                  <Switch
                    checked={settings.emailUpdates}
                    onCheckedChange={(value) =>
                      setSettings((prev) => ({ ...prev, emailUpdates: value }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Comment alerts</p>
                    <p className="text-xs text-muted-foreground">When someone replies to you.</p>
                  </div>
                  <Switch
                    checked={settings.commentAlerts}
                    onCheckedChange={(value) =>
                      setSettings((prev) => ({ ...prev, commentAlerts: value }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Weekly digest</p>
                    <p className="text-xs text-muted-foreground">A summary of your progress.</p>
                  </div>
                  <Switch
                    checked={settings.weeklyDigest}
                    onCheckedChange={(value) =>
                      setSettings((prev) => ({ ...prev, weeklyDigest: value }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="rounded-3xl border border-border/60 bg-card/85 shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-xl font-[var(--font-editorial)]">
                  <ShieldCheck className="h-5 w-5 text-brand" />
                  Security
                </CardTitle>
                <CardDescription>Protect your account access.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Current password"
                  className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
                />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password"
                  className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
                />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  className="h-11 rounded-2xl border-border/60 bg-background/60 px-4"
                />
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Revoke other sessions</p>
                    <p className="text-xs text-muted-foreground">
                      Sign out from other devices after changing password.
                    </p>
                  </div>
                  <Switch
                    checked={revokeOtherSessions}
                    onCheckedChange={setRevokeOtherSessions}
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={passwordSubmitting}
                  variant="outline"
                  className="w-full border-border/60 text-foreground/80 hover:text-foreground hover:bg-foreground/5"
                >
                  {passwordSubmitting ? "Updating password..." : "Change password"}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-border/60 bg-card/85 shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-xl font-[var(--font-editorial)]">
                  <Lock className="h-5 w-5 text-brand" />
                  Privacy
                </CardTitle>
                <CardDescription>Control your public presence.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    Profile visibility
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {VISIBILITY_OPTIONS.map((item) => (
                      <Button
                        key={item.value}
                        type="button"
                        variant={settings.profileVisibility === item.value ? "default" : "outline"}
                        onClick={() =>
                          setSettings((prev) => ({ ...prev, profileVisibility: item.value }))
                        }
                        className="rounded-xl"
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Allow profile discovery</p>
                    <p className="text-xs text-muted-foreground">
                      Show profile in search and recommendations.
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowProfileDiscovery}
                    onCheckedChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        allowProfileDiscovery: value,
                      }))
                    }
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full border-border/60 text-foreground/80 hover:text-foreground hover:bg-foreground/5"
                  asChild
                >
                  <Link to="/profile">Manage public profile</Link>
                </Button>
              </CardContent>
            </Card>

            {settingsQuery.data?.isAdmin ? (
              <Card className="rounded-3xl border border-border/60 bg-card/85 shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
                <CardHeader className="space-y-2">
                  <CardTitle className="flex items-center gap-2 text-xl font-[var(--font-editorial)]">
                    <Database className="h-5 w-5 text-brand" />
                    Admin Tools
                  </CardTitle>
                  <CardDescription>
                    Import ready-to-use fake content for demos and QA.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                    This will import sample categories, stories, poems, and a series
                    under your account.
                  </div>
                  <Button
                    onClick={handleImportFakeData}
                    disabled={importFakeData.isPending}
                    variant="outline"
                    className="w-full border-border/60 text-foreground/80 hover:text-foreground hover:bg-foreground/5"
                  >
                    {importFakeData.isPending
                      ? "Importing fake data..."
                      : "Import fake data"}
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            <Card className="rounded-3xl border border-border/60 bg-card/85 shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-xl font-[var(--font-editorial)]">
                  <LogOut className="h-5 w-5 text-brand" />
                  Session
                </CardTitle>
                <CardDescription>Sign out of this device.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="w-full" onClick={logout}>
                  Sign out
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
