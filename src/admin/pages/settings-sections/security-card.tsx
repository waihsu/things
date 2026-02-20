import { Lock } from "lucide-react";
import { Button } from "@/src/admin/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/admin/components/ui/card";
import { Input } from "@/src/admin/components/ui/input";
import { Switch } from "@/src/admin/components/ui/switch";

type SecurityCardProps = {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  revokeOtherSessions: boolean;
  passwordSubmitting: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onRevokeSessionsChange: (value: boolean) => void;
  onChangePassword: () => void;
};

export function SecurityCard({
  email,
  currentPassword,
  newPassword,
  confirmPassword,
  revokeOtherSessions,
  passwordSubmitting,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onRevokeSessionsChange,
  onChangePassword,
}: SecurityCardProps) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-brand" />
          Security
        </CardTitle>
        <CardDescription>Password and session controls for admin account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-1.5">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Admin email</p>
          <Input value={email} readOnly className="border-border/60 bg-background/60" />
        </div>

        <Input
          type="password"
          value={currentPassword}
          onChange={(event) => onCurrentPasswordChange(event.target.value)}
          placeholder="Current password"
          className="border-border/60 bg-background/60"
        />
        <Input
          type="password"
          value={newPassword}
          onChange={(event) => onNewPasswordChange(event.target.value)}
          placeholder="New password"
          className="border-border/60 bg-background/60"
        />
        <Input
          type="password"
          value={confirmPassword}
          onChange={(event) => onConfirmPasswordChange(event.target.value)}
          placeholder="Confirm new password"
          className="border-border/60 bg-background/60"
        />

        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Revoke other sessions</p>
            <p className="text-xs text-muted-foreground">Sign out other devices after password change.</p>
          </div>
          <Switch checked={revokeOtherSessions} onCheckedChange={onRevokeSessionsChange} />
        </div>

        <Button onClick={onChangePassword} disabled={passwordSubmitting} className="w-full">
          {passwordSubmitting ? "Updating password..." : "Change Password"}
        </Button>
      </CardContent>
    </Card>
  );
}
