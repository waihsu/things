"use client";

import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/src/store/use-auth-store";
import { useGetSettings } from "@/src/queries/settings/api/use-get-settings";
import { useImportFakeData } from "@/src/queries/settings/api/use-import-fake-data";
import { useUpdateSettings } from "@/src/queries/settings/api/use-update-settings";
import type { Settings } from "@/src/queries/settings/api/types";
import { Badge } from "@/src/admin/components/ui/badge";
import { Button } from "@/src/admin/components/ui/button";
import { ProfileCard } from "./settings-sections/profile-card";
import { WorkspaceCard } from "./settings-sections/workspace-card";
import { SecurityCard } from "./settings-sections/security-card";
import { OperationsCards } from "./settings-sections/operations-cards";

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

  const handleSave = () => {
    updateSettings.mutate(settings, {
      onSuccess: () => {
        toast.success("Admin settings saved.");
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

  const handleSettingChange = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
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
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep this page for account, security, and workspace preferences.
              Moderation and user management live in their dedicated pages.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={settingsQuery.data?.isAdmin ? "default" : "secondary"}>
              <Shield className="h-3.5 w-3.5" />
              {settingsQuery.data?.isAdmin ? "Admin Access" : "Access Pending"}
            </Badge>
            <Button onClick={handleSave} disabled={updateSettings.isPending}>
              {updateSettings.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
        <div className="space-y-6">
          <WorkspaceCard settings={settings} onSettingChange={handleSettingChange} />
          <ProfileCard settings={settings} onSettingChange={handleSettingChange} />
        </div>

        <div className="space-y-6">
          <SecurityCard
            email={user?.email ?? ""}
            currentPassword={currentPassword}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            revokeOtherSessions={revokeOtherSessions}
            passwordSubmitting={passwordSubmitting}
            onCurrentPasswordChange={setCurrentPassword}
            onNewPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onRevokeSessionsChange={setRevokeOtherSessions}
            onChangePassword={handleChangePassword}
          />
          <OperationsCards
            isAdmin={Boolean(settingsQuery.data?.isAdmin)}
            importing={importFakeData.isPending}
            onImportFakeData={handleImportFakeData}
            onLogout={() => {
              void logout();
            }}
          />
        </div>
      </section>
    </div>
  );
}
