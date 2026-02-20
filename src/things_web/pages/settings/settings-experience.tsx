import { Brush } from "lucide-react";

import { ModeToggle } from "@/src/interface/themes/mode-toggle";
import { SectionCard, SwitchRow } from "./settings-shared";
import { useSettingsWorkspace } from "./settings-layout";

export default function SettingsExperiencePage() {
  const { settings, setSettings } = useSettingsWorkspace();

  return (
    <SectionCard
      id="experience"
      title="Experience"
      description="Reading, writing, and theme behavior."
      icon={Brush}
    >
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Theme mode</p>
          <p className="premium-muted text-xs">Light, dark, or system preference.</p>
        </div>
        <ModeToggle />
      </div>
      <SwitchRow
        title="Reading focus"
        description="Dim distractions while you are reading."
        checked={settings.readingFocus}
        onCheckedChange={(value) =>
          setSettings((prev) => ({ ...prev, readingFocus: value }))
        }
      />
      <SwitchRow
        title="Autosave drafts"
        description="Keep editor progress safe while typing."
        checked={settings.autoSave}
        onCheckedChange={(value) =>
          setSettings((prev) => ({ ...prev, autoSave: value }))
        }
      />
    </SectionCard>
  );
}
