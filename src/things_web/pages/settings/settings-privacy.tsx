import { Link } from "react-router";
import { Lock } from "lucide-react";

import type { ProfileVisibility } from "@/src/queries/settings/api/types";
import { Button } from "../../components/ui/button";
import { SectionCard, SwitchRow } from "./settings-shared";
import { useSettingsWorkspace } from "./settings-layout";

const VISIBILITY_OPTIONS: Array<{ value: ProfileVisibility; label: string; hint: string }> = [
  { value: "public", label: "Public", hint: "Anyone can find your profile." },
  { value: "members", label: "Members", hint: "Visible to signed-in members." },
  { value: "private", label: "Private", hint: "Only you can view your profile." },
];

export default function SettingsPrivacyPage() {
  const { settings, setSettings } = useSettingsWorkspace();

  return (
    <SectionCard
      id="privacy"
      title="Privacy"
      description="Control discoverability and profile exposure."
      icon={Lock}
    >
      <div className="space-y-2">
        <p className="premium-muted text-xs uppercase tracking-[0.22em]">
          Profile visibility
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {VISIBILITY_OPTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() =>
                setSettings((prev) => ({ ...prev, profileVisibility: item.value }))
              }
              className={`rounded-xl border px-3 py-3 text-left transition ${
                settings.profileVisibility === item.value
                  ? "border-brand/45 bg-brand/16 text-brand-strong"
                  : "border-border/70 bg-background/65 text-foreground/80 hover:bg-foreground/6 hover:text-foreground"
              }`}
            >
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
            </button>
          ))}
        </div>
      </div>
      <SwitchRow
        title="Allow profile discovery"
        description="Include your profile in search and recommendations."
        checked={settings.allowProfileDiscovery}
        onCheckedChange={(value) =>
          setSettings((prev) => ({
            ...prev,
            allowProfileDiscovery: value,
          }))
        }
      />
      <Button
        variant="outline"
        className="w-full border-border/70 bg-card/70 text-foreground/85 hover:bg-foreground/6 hover:text-foreground"
        asChild
      >
        <Link to="/profile">Manage public profile</Link>
      </Button>
    </SectionCard>
  );
}
