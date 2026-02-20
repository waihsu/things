import type { PresenceStatus } from "@/src/queries/presence/api/types";

type PresenceBadgeProps = {
  presence?: PresenceStatus;
  className?: string;
};

export function PresenceBadge({ presence, className = "" }: PresenceBadgeProps) {
  if (!presence) {
    return null;
  }

  const label = presence.online ? "Online" : "Offline";
  const toneClass = presence.online
    ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-200"
    : "border-border/60 bg-background/60 text-foreground/65";
  const dotClass = presence.online ? "bg-emerald-400" : "bg-foreground/45";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${toneClass} ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}
