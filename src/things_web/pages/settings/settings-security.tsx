import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { SectionCard, SwitchRow } from "./settings-shared";

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

export default function SettingsSecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

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

  return (
    <SectionCard
      id="security"
      title="Security"
      description="Change password and secure active sessions."
      icon={ShieldCheck}
    >
      <Input
        type="password"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        placeholder="Current password"
        className="h-11 rounded-2xl border-border/70 bg-background/70 px-4"
      />
      <Input
        type="password"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        placeholder="New password"
        className="h-11 rounded-2xl border-border/70 bg-background/70 px-4"
      />
      <Input
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Confirm new password"
        className="h-11 rounded-2xl border-border/70 bg-background/70 px-4"
      />
      <SwitchRow
        title="Revoke other sessions"
        description="Sign out on other devices after password change."
        checked={revokeOtherSessions}
        onCheckedChange={setRevokeOtherSessions}
      />
      <Button
        onClick={handleChangePassword}
        disabled={passwordSubmitting}
        variant="outline"
        className="w-full border-border/70 bg-card/70 text-foreground/85 hover:bg-foreground/6 hover:text-foreground"
      >
        {passwordSubmitting ? "Updating password..." : "Change password"}
      </Button>
    </SectionCard>
  );
}
