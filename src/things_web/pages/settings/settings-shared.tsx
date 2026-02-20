import { type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Switch } from "../../components/ui/switch";

type SectionCardProps = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
};

export function SectionCard({
  id,
  title,
  description,
  icon: Icon,
  children,
}: SectionCardProps) {
  return (
    <Card id={id} className="premium-panel gap-0 rounded-3xl py-0">
      <CardHeader className="border-b border-border/70 py-5">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Icon className="h-5 w-5 text-brand" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 py-6">{children}</CardContent>
    </Card>
  );
}

type SwitchRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
};

export function SwitchRow({
  title,
  description,
  checked,
  onCheckedChange,
}: SwitchRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="premium-muted text-xs">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
