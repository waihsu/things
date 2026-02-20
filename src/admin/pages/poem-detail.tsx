import { useEffect, useRef, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Eye,
  PenSquare,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/src/things_web/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/things_web/components/ui/avatar";
import { useGetPoem } from "@/src/queries/poems/api/use-get-poem";
import { useDeletePoem } from "@/src/queries/poems/api/use-delete-poem";
import { useIncrementPoemRead } from "@/src/queries/poems/api/use-increment-poem-read";
import { useGetPresence } from "@/src/queries/presence/api/use-get-presence";
import { useAuthStore } from "@/src/store/use-auth-store";
import { PresenceBadge } from "@/src/interface/presence/presence-badge";

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export default function PoemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: poem, isLoading, isError } = useGetPoem(id || "");
  const deletePoem = useDeletePoem();
  const incrementRead = useIncrementPoemRead();
  const { presenceByUserId } = useGetPresence(poem ? [poem.user_id] : []);
  const incrementedRef = useRef(false);

  useEffect(() => {
    if (!id || !poem?.id || incrementedRef.current) return;
    incrementedRef.current = true;
    incrementRead.mutate({ poemId: poem.id });
  }, [id, poem?.id, incrementRead]);

  if (!id) {
    return <div className="p-6">Invalid poem.</div>;
  }

  if (isLoading) {
    return <div className="p-6">Loading poem...</div>;
  }

  if (isError || !poem) {
    return <div className="p-6">Poem not found.</div>;
  }

  const canEdit = user?.id === poem.user_id;
  const publishedAt = formatDate(poem.created_at);
  const updatedAt = formatDate(poem.updated_at);
  const lines = poem.content.split("\n");
  const wordCount = poem.content.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(Math.max(wordCount, 60) / 140));
  const readsLabel = compactNumber.format(poem.read_count ?? 0);
  const authorName = poem.author_name || "Unknown";
  const authorPresence = presenceByUserId[poem.user_id];
  const authorInitial = authorName.slice(0, 1).toUpperCase();

  return (
    <div className="relative min-h-screen text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(243,213,149,0.24),transparent_42%),radial-gradient(circle_at_90%_8%,rgba(109,213,181,0.18),transparent_40%),linear-gradient(180deg,#fbf7ef,#fefcf8)] dark:bg-[radial-gradient(circle_at_16%_10%,rgba(244,208,131,0.18),transparent_42%),radial-gradient(circle_at_90%_8%,rgba(109,213,181,0.14),transparent_40%),linear-gradient(180deg,#0b0c12,#10131d_45%,#0b0d12)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(0deg,rgba(0,0,0,0.06)_1px,transparent_1px)] dark:[background-image:linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:100%_30px]" />
      </div>

      <div className="mx-auto px-4 py-10 md:py-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/poems"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-xs uppercase tracking-[0.24em] text-foreground/70 transition hover:text-foreground hover:border-border"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to poems
          </Link>

          {canEdit ? (
            <div className="flex items-center gap-2">
              <Link to={`/poems/${poem.id}/edit`}>
                <Button
                  variant="outline"
                  className="border-border/60 text-foreground/80 hover:text-foreground hover:bg-foreground/5"
                >
                  <PenSquare className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="destructive"
                onClick={() =>
                  deletePoem.mutate(poem.id, {
                    onSuccess: () => navigate("/poems"),
                  })
                }
                disabled={deletePoem.isPending}
              >
                <Trash2 className="h-4 w-4" />
                {deletePoem.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[0.22fr_0.56fr_0.22fr]">
          <aside className="order-2 lg:order-1">
            <div className="space-y-5 lg:sticky lg:top-24">
              <div className="rounded-[1.75rem] border border-border/60 bg-card/75 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
                <p className="text-[11px] uppercase tracking-[0.35em] text-foreground/55">
                  Author
                </p>
                <div className="mt-4 flex items-start gap-3">
                  <Avatar className="h-11 w-11 border border-border/60">
                    <AvatarImage
                      src={poem.author_avatar || undefined}
                      alt={authorName}
                    />
                    <AvatarFallback>{authorInitial}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {authorName}
                    </p>
                    <PresenceBadge presence={authorPresence} className="mt-1" />
                    {poem.author_username ? (
                      <Link
                        to={`/profile/${poem.author_username}`}
                        className="mt-1 inline-flex text-xs text-brand-strong hover:text-brand"
                      >
                        View profile
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border/60 bg-card/70 p-5">
                <p className="text-[11px] uppercase tracking-[0.35em] text-foreground/55">
                  Poem Metrics
                </p>
                <div className="mt-4 space-y-3 text-sm text-foreground/75">
                  <MetaRow
                    icon={<Eye className="h-4 w-4" />}
                    label="Reads"
                    value={readsLabel}
                  />
                  <MetaRow
                    icon={<Clock3 className="h-4 w-4" />}
                    label="Read time"
                    value={`${readTime} min`}
                  />
                  <MetaRow
                    icon={<Sparkles className="h-4 w-4" />}
                    label="Lines"
                    value={lines.length}
                  />
                </div>
              </div>
            </div>
          </aside>

          <article className="order-1 rounded-[2.35rem] border border-border/60 bg-card/80 px-7 pb-10 pt-8 shadow-[0_36px_90px_rgba(0,0,0,0.28)] backdrop-blur-[2px] dark:bg-[#0e1117]/90 md:px-10 md:pt-10 lg:order-2">
            <p className="text-[11px] uppercase tracking-[0.4em] text-foreground/50">
              Poem
            </p>
            <h1 className="mt-4 text-4xl leading-tight tracking-wide md:text-5xl">
              {poem.title}
            </h1>
            <p className="mt-4 flex flex-wrap items-center gap-3 text-sm text-foreground/62">
              {publishedAt ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  {publishedAt}
                </span>
              ) : null}
              {updatedAt ? <span>Updated {updatedAt}</span> : null}
            </p>

            {poem.summary ? (
              <div className="mt-6 rounded-2xl border border-border/60 bg-card/70 p-5 text-foreground/82 leading-relaxed">
                {poem.summary}
              </div>
            ) : null}

            <div className="mt-8 border-t border-border/60 pt-8 space-y-3 text-lg leading-[1.95] text-foreground/90 md:space-y-4">
              {lines.map((rawLine, index) => {
                const line = rawLine.trimEnd();
                if (index === 0 && line) {
                  return (
                    <p key={`${poem.id}-${index}`}>
                      <span className="float-left mr-3 mt-1 text-5xl font-[var(--font-editorial)] text-brand">
                        {line[0]}
                      </span>
                      {line.slice(1)}
                    </p>
                  );
                }
                return <p key={`${poem.id}-${index}`}>{line || "\u00A0"}</p>;
              })}
            </div>

            <div className="mt-10 border-t border-border/60 pt-5 text-xs uppercase tracking-[0.28em] text-foreground/50 flex items-center justify-between">
              <span>End of poem</span>
              <span>Keep writing</span>
            </div>
          </article>

          <aside className="order-3">
            <div className="space-y-5 lg:sticky lg:top-24">
              <div className="rounded-[1.75rem] border border-border/60 bg-card/70 p-5">
                <p className="text-[11px] uppercase tracking-[0.35em] text-foreground/55">
                  Categories
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(poem.category_names || []).length ? (
                    poem.category_names.map((category) => (
                      <span
                        key={category}
                        className="rounded-full border border-border/60 bg-card/80 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-foreground/72"
                      >
                        {category}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-foreground/60">No categories</p>
                  )}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border/60 bg-card/70 p-5">
                <p className="text-[11px] uppercase tracking-[0.35em] text-foreground/55">
                  Tags
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(poem.tags || []).length ? (
                    poem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] uppercase tracking-[0.1em] text-brand-strong"
                      >
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-foreground/60">No tags</p>
                  )}
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
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-background/35 px-3 py-2">
      <span className="inline-flex items-center gap-1.5 text-foreground/65">
        {icon}
        {label}
      </span>
      <span className="font-medium text-foreground/86">{value}</span>
    </div>
  );
}
