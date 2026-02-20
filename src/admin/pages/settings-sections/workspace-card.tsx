import { Bell, Brush } from "lucide-react";
import { ModeToggle } from "@/src/interface/themes/mode-toggle";
import type { Settings } from "@/src/queries/settings/api/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/admin/components/ui/card";
import { Switch } from "@/src/admin/components/ui/switch";

type WorkspaceCardProps = {
  settings: Settings;
  onSettingChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
};

export function WorkspaceCard({ settings, onSettingChange }: WorkspaceCardProps) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brush className="h-5 w-5 text-brand" />
          Workspace
        </CardTitle>
        <CardDescription>
          Admin console appearance and personal preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">Light / dark / system</p>
          </div>
          <ModeToggle />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Reading focus</p>
            <p className="text-xs text-muted-foreground">Dim background noise while reading.</p>
          </div>
          <Switch
            checked={settings.readingFocus}
            onCheckedChange={(value) => onSettingChange("readingFocus", value)}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Autosave drafts</p>
            <p className="text-xs text-muted-foreground">Automatically persist editor drafts.</p>
          </div>
          <Switch
            checked={settings.autoSave}
            onCheckedChange={(value) => onSettingChange("autoSave", value)}
          />
        </div>

        <div className="rounded-xl border border-border/60 bg-background/60 p-3">
          <p className="mb-2 inline-flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4 text-brand" />
            Notifications
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
              <span className="text-xs text-muted-foreground">Email updates</span>
              <Switch
                checked={settings.emailUpdates}
                onCheckedChange={(value) => onSettingChange("emailUpdates", value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
              <span className="text-xs text-muted-foreground">Comment alerts</span>
              <Switch
                checked={settings.commentAlerts}
                onCheckedChange={(value) => onSettingChange("commentAlerts", value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
              <span className="text-xs text-muted-foreground">Weekly digest</span>
              <Switch
                checked={settings.weeklyDigest}
                onCheckedChange={(value) => onSettingChange("weeklyDigest", value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
