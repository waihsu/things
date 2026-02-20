import { Database, Lock } from "lucide-react";

import { Button } from "../../components/ui/button";
import { SectionCard } from "./settings-shared";
import { useSettingsWorkspace } from "./settings-layout";

export default function SettingsAdminPage() {
  const { isAdmin, importFakeData, importPending } = useSettingsWorkspace();

  if (!isAdmin) {
    return (
      <SectionCard
        id="admin"
        title="Admin Tools"
        description="Restricted section."
        icon={Lock}
      >
        <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
          Admin access is required for this page.
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      id="admin"
      title="Admin Tools"
      description="Import fake content for QA, demos, and onboarding flows."
      icon={Database}
    >
      <div className="rounded-2xl border border-border/70 bg-background/65 px-4 py-3 text-sm text-muted-foreground">
        This imports 10 stories, 10 poems, 10 series, and 10 episodes under this account.
      </div>
      <Button
        onClick={importFakeData}
        disabled={importPending}
        variant="outline"
        className="w-full border-border/70 bg-card/70 text-foreground/85 hover:bg-foreground/6 hover:text-foreground"
      >
        {importPending ? "Importing fake data..." : "Import fake data"}
      </Button>
    </SectionCard>
  );
}
