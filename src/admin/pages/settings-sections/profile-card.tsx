import { Eye, UserRound } from "lucide-react";
import type { ProfileVisibility, Settings } from "@/src/queries/settings/api/types";
import { Button } from "@/src/admin/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/admin/components/ui/card";
import { Switch } from "@/src/admin/components/ui/switch";
import { Textarea } from "@/src/admin/components/ui/textarea";

type ProfileCardProps = {
  settings: Settings;
  onSettingChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
};

const visibilityOptions: Array<{ value: ProfileVisibility; label: string }> = [
  { value: "public", label: "Public" },
  { value: "members", label: "Members" },
  { value: "private", label: "Private" },
];

export function ProfileCard({ settings, onSettingChange }: ProfileCardProps) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="h-5 w-5 text-brand" />
          Profile
        </CardTitle>
        <CardDescription>
          Public profile visibility and discovery settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Profile visibility
          </p>
          <div className="grid grid-cols-3 gap-2">
            {visibilityOptions.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={settings.profileVisibility === item.value ? "default" : "outline"}
                onClick={() => onSettingChange("profileVisibility", item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-medium">
              <Eye className="h-4 w-4 text-brand" />
              Allow profile discovery
            </p>
            <p className="text-xs text-muted-foreground">
              Show this profile in search and recommendations.
            </p>
          </div>
          <Switch
            checked={settings.allowProfileDiscovery}
            onCheckedChange={(value) => onSettingChange("allowProfileDiscovery", value)}
          />
        </div>

        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Bio snippet
          </p>
          <Textarea
            value={settings.bioSnippet}
            onChange={(event) => onSettingChange("bioSnippet", event.target.value)}
            maxLength={280}
            className="min-h-[110px] border-border/60 bg-background/60"
            placeholder="Short line shown on your public profile..."
          />
          <p className="text-xs text-muted-foreground">{settings.bioSnippet.length}/280</p>
        </div>
      </CardContent>
    </Card>
  );
}
