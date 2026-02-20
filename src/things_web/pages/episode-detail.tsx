import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Layers,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { Button } from "@/src/things_web/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/things_web/components/ui/avatar";
import { useGetEpisode } from "@/src/queries/episodes/api/use-get-episode";
import { useGetSerie } from "@/src/queries/series/api/use-get-serie";
import { useGetPresence } from "@/src/queries/presence/api/use-get-presence";
import { useAuthStore } from "@/src/store/use-auth-store";
import { PresenceBadge } from "@/src/interface/presence/presence-badge";

export default function EpisodeDetailPage() {
  const { seriesId, episodeId } = useParams();
  const { user } = useAuthStore();
  const { data: episode, isLoading, isError } = useGetEpisode(episodeId || "");
  const seriesLookupId = seriesId || episode?.serie_id || "";
  const { data: seriesMeta } = useGetSerie(seriesLookupId);
  const authorUserId = seriesMeta?.user_id || episode?.series_user_id || "";
  const { presenceByUserId } = useGetPresence(authorUserId ? [authorUserId] : []);

  if (!episodeId) return <div className="p-6">Invalid episode.</div>;
  if (isLoading) return <div className="p-6">Loading episode...</div>;
  if (isError || !episode) return <div className="p-6">Episode not found.</div>;

  const canEdit = user?.id === episode.series_user_id;
  const wordCount = episode.paragraph.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(Math.max(wordCount, 80) / 200));
  const createdAt = formatDate(episode.created_at);
  const updatedAt = formatDate(episode.updated_at);
  const seriesLabel = episode.series_name || seriesMeta?.name || "Series";
  const chapterOrder = episode.order ?? 1;
  const lines = episode.paragraph.split("\n");

  const authorName = seriesMeta?.author_name || "Unknown";
  const authorInitial = authorName.slice(0, 1).toUpperCase();
  const authorAvatar = seriesMeta?.author_avatar || null;
  const authorHandle =
    seriesMeta?.author_username || seriesMeta?.user_id || episode.series_user_id || "";
  const authorPresence = authorUserId ? presenceByUserId[authorUserId] : undefined;

  return (
    <div className="relative min-h-screen w-full text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(214,170,99,0.24),transparent_42%),radial-gradient(circle_at_90%_8%,rgba(88,128,186,0.18),transparent_40%),linear-gradient(180deg,#f6f0e2,#fdf9f0)] dark:bg-[radial-gradient(circle_at_16%_10%,rgba(224,189,127,0.2),transparent_42%),radial-gradient(circle_at_90%_8%,rgba(74,142,196,0.14),transparent_40%),linear-gradient(180deg,#080f1a,#0d1725_45%,#09111d)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(0deg,rgba(0,0,0,0.06)_1px,transparent_1px)] dark:[background-image:linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:100%_30px]" />
      </div>

      <div className="w-full px-3 py-10 sm:px-4 md:px-6 md:py-14 xl:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to={seriesLookupId ? `/series/${seriesLookupId}` : "/series"}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-xs uppercase tracking-[0.24em] text-foreground/70 transition hover:text-foreground hover:border-border"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to series
          </Link>

          {canEdit ? (
            <Link
              to={`/series/${seriesLookupId}/episodes/${episode.id}/edit`}
              className="w-full sm:w-auto"
            >
              <Button
                variant="outline"
                className="w-full border-border/60 text-foreground/80 hover:text-foreground hover:bg-foreground/5 sm:w-auto"
              >
                Edit chapter
              </Button>
            </Link>
          ) : null}
        </div>

        <div className="mt-6 grid items-start gap-8 xl:grid-cols-[minmax(220px,0.9fr)_minmax(0,2fr)_minmax(220px,0.9fr)] 2xl:grid-cols-[minmax(240px,0.85fr)_minmax(0,2.2fr)_minmax(240px,0.85fr)]">
          <aside className="order-2 xl:order-1">
            <div className="space-y-5 xl:sticky xl:top-24">
              <div className="rounded-[1.75rem] border border-border/60 bg-card/75 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
                <p className="text-[11px] uppercase tracking-[0.35em] text-foreground/55">
                  Series Author
                </p>
                {authorHandle ? (
                  <Link
                    to={`/profile/${authorHandle}`}
                    className="mt-4 inline-flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-background/35 px-3 py-3 transition hover:border-brand/40"
                  >
                    <Avatar className="h-11 w-11 border border-border/60">
                      <AvatarImage src={authorAvatar || undefined} alt={authorName} />
                      <AvatarFallback>{authorInitial}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {authorName}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="block truncate text-xs text-brand-strong">
                          Open profile
                        </span>
                        <PresenceBadge presence={authorPresence} />
                      </span>
                    </span>
                  </Link>
                ) : (
                  <div className="mt-4 inline-flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-background/35 px-3 py-3">
                    <Avatar className="h-11 w-11 border border-border/60">
                      <AvatarImage src={authorAvatar || undefined} alt={authorName} />
                      <AvatarFallback>{authorInitial}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        {authorName}
                      </span>
                      <PresenceBadge presence={authorPresence} className="mt-1" />
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-[1.75rem] border border-border/60 bg-card/70 p-5">
                <p className="text-[11px] uppercase tracking-[0.35em] text-foreground/55">
                  Chapter Metrics
                </p>
                <div className="mt-4 space-y-3 text-sm text-foreground/75">
                  <MetaRow icon={Sparkles} label="Chapter" value={chapterOrder} />
                  <MetaRow icon={Clock3} label="Read time" value={`${readTime} min`} />
                  <MetaRow icon={Layers} label="Word count" value={wordCount} />
                  {createdAt ? (
                    <MetaRow icon={CalendarDays} label="Published" value={createdAt} />
                  ) : null}
                </div>
              </div>
            </div>
          </aside>

          <article className="order-1 min-w-0 rounded-[2.35rem] border border-border/60 bg-card/80 px-7 pb-10 pt-8 shadow-[0_36px_90px_rgba(0,0,0,0.28)] backdrop-blur-[2px] dark:bg-[#0e1117]/90 md:px-10 md:pt-10 xl:order-2">
            <p className="text-[11px] uppercase tracking-[0.4em] text-foreground/50">Chapter</p>
            <h1 className="mt-4 text-4xl leading-tight tracking-wide md:text-5xl">
              {episode.name}
            </h1>
            <p className="mt-3 text-sm text-foreground/62">{seriesLabel}</p>

            <div className="mt-6 rounded-2xl border border-border/60 bg-card/70 p-5 text-foreground/82 leading-relaxed">
              {seriesLabel} • Chapter {chapterOrder}
            </div>

            <div className="mt-8 border-t border-border/60 pt-8 space-y-4 text-lg leading-[1.9] text-foreground/90">
              {lines.map((rawLine, idx) => {
                const line = rawLine.trimEnd();
                if (idx === 0 && line) {
                  return (
                    <p key={`${episode.id}-${idx}`}>
                      <span className="float-left mr-3 mt-1 text-5xl font-[var(--font-editorial)] text-brand">
                        {line[0]}
                      </span>
                      {line.slice(1)}
                    </p>
                  );
                }
                return <p key={`${episode.id}-${idx}`}>{line || "\u00A0"}</p>;
              })}
            </div>

            <div className="mt-12 border-t border-border/60 pt-6 text-xs uppercase tracking-[0.3em] text-foreground/50 flex justify-between">
              <span>End of chapter</span>
              <span>Continue the arc</span>
            </div>
          </article>

          <aside className="order-3">
            <div className="space-y-5 xl:sticky xl:top-24">
              <div className="rounded-[1.75rem] border border-border/60 bg-card/70 p-5">
                <p className="text-[11px] uppercase tracking-[0.35em] text-foreground/55">
                  Series
                </p>
                <p className="mt-3 text-sm text-foreground/75">{seriesLabel}</p>
                {seriesLookupId ? (
                  <Link
                    to={`/series/${seriesLookupId}`}
                    className="mt-3 inline-flex text-xs uppercase tracking-[0.2em] text-brand-strong hover:text-brand"
                  >
                    Open series
                  </Link>
                ) : null}
              </div>

              <div className="rounded-[1.75rem] border border-border/60 bg-card/70 p-5">
                <p className="text-[11px] uppercase tracking-[0.35em] text-foreground/55">
                  Timeline
                </p>
                <div className="mt-3 space-y-2 text-sm text-foreground/72">
                  <p>{createdAt ? `Published ${createdAt}` : "Published date unavailable"}</p>
                  <p>{updatedAt ? `Updated ${updatedAt}` : "No updates yet"}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-background/35 px-3 py-2">
      <span className="inline-flex items-center gap-1.5 text-foreground/65">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="font-medium text-foreground/86">{value}</span>
    </div>
  );
}
