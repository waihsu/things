import { Link } from "react-router";
import { UserRound } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { SectionCard } from "./settings-shared";
import { useSettingsWorkspace } from "./settings-layout";

export default function SettingsAccountPage() {
  const { user, settings, setSettings } = useSettingsWorkspace();

  return (
    <SectionCard
      id="account"
      title="Account"
      description="Your core identity and public summary."
      icon={UserRound}
    >
      <div className="grid gap-2">
        <p className="premium-muted text-xs uppercase tracking-[0.28em]">Email</p>
        <Input
          value={user?.email ?? ""}
          readOnly
          className="h-11 rounded-2xl border-border/70 bg-background/70 px-4"
        />
      </div>
      <div className="grid gap-2">
        <p className="premium-muted text-xs uppercase tracking-[0.28em]">Public bio snippet</p>
        <Textarea
          value={settings.bioSnippet}
          onChange={(event) =>
            setSettings((prev) => ({ ...prev, bioSnippet: event.target.value }))
          }
          maxLength={280}
          placeholder="One short line people will see on your public profile."
          className="min-h-[120px] rounded-2xl border-border/70 bg-background/70 px-4 py-3"
        />
        <p className="premium-muted text-xs">{settings.bioSnippet.length}/280</p>
      </div>
      <Button
        asChild
        className="bg-brand text-brand-ink font-semibold shadow-[0_12px_30px_rgba(196,153,79,0.32)] hover:bg-brand-soft"
      >
        <Link to="/profile">Edit full profile</Link>
      </Button>
    </SectionCard>
  );
}
