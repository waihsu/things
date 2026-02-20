import { Bell } from "lucide-react";

import { SectionCard, SwitchRow } from "./settings-shared";
import { useSettingsWorkspace } from "./settings-layout";

export default function SettingsNotificationsPage() {
  const { settings, setSettings } = useSettingsWorkspace();

  return (
    <SectionCard
      id="notifications"
      title="Notifications"
      description="Choose what reaches you and how often."
      icon={Bell}
    >
      <SwitchRow
        title="Email updates"
        description="Likes, follows, and comment activity."
        checked={settings.emailUpdates}
        onCheckedChange={(value) =>
          setSettings((prev) => ({ ...prev, emailUpdates: value }))
        }
      />
      <SwitchRow
        title="Comment alerts"
        description="Realtime alerts for replies and mentions."
        checked={settings.commentAlerts}
        onCheckedChange={(value) =>
          setSettings((prev) => ({ ...prev, commentAlerts: value }))
        }
      />
      <SwitchRow
        title="Weekly digest"
        description="A summary of your writing progress."
        checked={settings.weeklyDigest}
        onCheckedChange={(value) =>
          setSettings((prev) => ({ ...prev, weeklyDigest: value }))
        }
      />
    </SectionCard>
  );
}
