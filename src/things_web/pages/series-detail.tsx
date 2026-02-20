import { Button } from "@/src/things_web/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/things_web/components/ui/avatar";
import { Textarea } from "@/src/things_web/components/ui/textarea";
import { useGetSerie } from "@/src/queries/series/api/use-get-serie";
import { useDeleteSerie } from "@/src/queries/series/api/use-delete-serie";
import { useGetEpisodes } from "@/src/queries/episodes/api/use-get-episodes";
import { useDeleteEpisode } from "@/src/queries/episodes/api/use-delete-episode";
import { useGetSeriesComments } from "@/src/queries/series/api/use-get-series-comments";
import { useAddSeriesComment } from "@/src/queries/series/api/use-add-series-comment";
import { useDeleteSeriesComment } from "@/src/queries/series/api/use-delete-series-comment";
import { useToggleSeriesLike } from "@/src/queries/series/api/use-toggle-series-like";
import { useGetPresence } from "@/src/queries/presence/api/use-get-presence";
import { useAuthStore } from "@/src/store/use-auth-store";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Heart, MessageSquare } from "lucide-react";
import { useIncrementSeriesRead } from "@/src/queries/series/api/use-increment-series-read";
import { PresenceBadge } from "@/src/interface/presence/presence-badge";

export default function SeriesDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: serie, isLoading, isError } = useGetSerie(id || "");
  const { data: episodes = [] } = useGetEpisodes(id || "");
  const deleteSeries = useDeleteSerie();
  const deleteEpisode = useDeleteEpisode();
  const { data: comments = [] } = useGetSeriesComments(id || "");
  const addComment = useAddSeriesComment();
  const deleteComment = useDeleteSeriesComment();
  const toggleLike = useToggleSeriesLike();
  const incrementRead = useIncrementSeriesRead();
  const { presenceByUserId } = useGetPresence(serie ? [serie.user_id] : []);
  const [commentDraft, setCommentDraft] = useState("");
  const hasIncremented = useRef(false);

  useEffect(() => {
    if (!id || !serie?.id || hasIncremented.current) return;
    hasIncremented.current = true;
    incrementRead.mutate({ seriesId: serie.id });
  }, [id, serie?.id, incrementRead]);

  if (!id) {
    return <div className="p-6">Invalid series.</div>;
  }

  if (isLoading) {
    return <div className="p-6">Loading series...</div>;
  }

  if (isError || !serie) {
    return <div className="p-6">Series not found.</div>;
  }

  const canEdit = user?.id === serie.user_id;
  const createdAt = formatDate(serie.created_at);
  const updatedAt = formatDate(serie.updated_at);
  const episodesCount = Number.isFinite(serie.episodes_count)
    ? serie.episodes_count
    : episodes.length;
  const coverInitial = serie.name.trim().charAt(0).toUpperCase() || "S";
  const authorPresence = presenceByUserId[serie.user_id];
  const likeCount = serie.like_count ?? 0;
  const commentCount = serie.comment_count ?? 0;
  const likedByMe = Boolean(serie.liked_by_me);
  const displayCommentCount = comments.length || commentCount;

  return (
    <div className="relative min-h-screen w-full text-foreground">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(214,170,99,0.25),transparent_45%),radial-gradient(circle_at_82%_6%,rgba(88,128,186,0.18),transparent_40%),linear-gradient(180deg,#f6f0e2,#fdf9f0)] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(224,189,127,0.2),transparent_45%),radial-gradient(circle_at_82%_6%,rgba(74,142,196,0.16),transparent_40%),linear-gradient(180deg,#080f1a,#0d1725_45%,#09111d)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(0deg,rgba(0,0,0,0.06)_1px,transparent_1px)] dark:[background-image:linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:100%_32px]" />
      </div>

      <div className="w-full px-3 py-10 sm:px-4 md:px-6 md:py-14 xl:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/series"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-xs uppercase tracking-[0.24em] text-foreground/70 transition hover:border-border hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to series
          </Link>
        </div>

        <div className="mt-6 grid items-start gap-10 xl:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.45fr)] 2xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.6fr)]">
          {/* LEFT — Cover + Meta */}
          <aside className="space-y-6 xl:sticky xl:top-24">
            <div className="relative overflow-hidden rounded-[2.75rem] border border-border/60 bg-card/80 shadow-[0_30px_70px_rgba(0,0,0,0.25)] backdrop-blur-[2px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(243,213,149,0.22),transparent_45%)] dark:bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_45%)]" />
              <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:18px_18px] dark:opacity-[0.16]" />
              <div className="relative z-10 flex min-h-[260px] flex-col justify-between p-6 sm:min-h-[320px] sm:p-8 md:min-h-[380px] lg:min-h-[440px] md:p-10">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.5em] text-foreground/55">
                    Series
                  </p>
                  <div className="mt-6 flex items-end gap-4">
                    <span className="text-6xl sm:text-7xl md:text-8xl font-(--font-editorial) text-brand drop-shadow-[0_12px_22px_rgba(0,0,0,0.18)]">
                      {coverInitial}
                    </span>
                    <div className="pb-2">
                      <p className="text-xs uppercase tracking-[0.35em] text-foreground/55">
                        Story Arc
                      </p>
                      <p className="text-sm text-foreground/70">
                        A serialized novel
                      </p>
                    </div>
                  </div>
                  <p className="mt-6 text-lg font-semibold text-foreground sm:text-xl">
                    {serie.name}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(serie.category_names || ["Uncategorized"]).map((cat, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-full border border-border/60 bg-card/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border/60 bg-card/70 p-5 md:p-6">
              <div className="grid gap-4 text-sm text-foreground/80">
                <MetaRow
                  label="Author"
                  value={
                    <span className="inline-flex items-center gap-2">
                      <span>{serie.author_name || "Unknown"}</span>
                      <PresenceBadge presence={authorPresence} />
                    </span>
                  }
                />
                <MetaRow label="Chapters" value={episodesCount} />
                {createdAt && <MetaRow label="Created" value={createdAt} />}
                {updatedAt && <MetaRow label="Updated" value={updatedAt} />}
              </div>
            </div>
          </aside>

          {/* RIGHT — Details + Chapters */}
          <section className="min-w-0 space-y-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.55em] text-foreground/55">
                  Story Arc
                </p>
                <h1 className="mt-4 text-4xl md:text-5xl font-(--font-editorial) tracking-wide text-foreground drop-shadow-lg">
                  {serie.name}
                </h1>
                <p className="mt-3 text-sm text-foreground/60">
                  {episodesCount} chapter{episodesCount === 1 ? "" : "s"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(serie.category_names || ["Uncategorized"]).map((cat, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-foreground/70"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <Button
                  variant="outline"
                  className={`border transition-colors ${
                    likedByMe
                      ? "border-brand/50 bg-brand text-[#1b1207] hover:bg-brand-soft dark:border-brand/60 dark:bg-brand dark:text-[#1b1207]"
                      : "border-border/60 bg-background/70 text-foreground/80 hover:text-foreground hover:bg-background dark:border-white/20 dark:bg-white/[0.03] dark:text-white/75 dark:hover:bg-white/[0.08] dark:hover:text-white"
                  }`}
                  onClick={() => toggleLike.mutate({ seriesId: serie.id })}
                >
                  <Heart className="h-4 w-4" />
                  {likeCount}
                </Button>
                {canEdit && (
                  <>
                    <Link to={`/series/${serie.id}/edit`}>
                      <Button
                        variant="outline"
                        className="border-border/60 text-foreground/80 hover:text-foreground hover:bg-foreground/5 shadow-sm"
                      >
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      className="shadow-sm"
                      onClick={() =>
                        deleteSeries.mutate(serie.id, {
                          onSuccess: () => navigate("/series"),
                        })
                      }
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-[2.25rem] border border-border/60 bg-card/80 p-7 md:p-9 shadow-[0_30px_70px_rgba(0,0,0,0.25)] backdrop-blur-[2px]">
              <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">
                Synopsis
              </p>
              <p className="mt-4 text-lg leading-relaxed text-foreground/85 font-medium">
                {serie.summary ||
                  "No summary yet. Add a synopsis to set the tone of this arc."}
              </p>
            </div>

            <section
              id="comments"
              className="rounded-[2.25rem] border border-border/60 bg-card/70 p-6 sm:p-7 md:p-9 backdrop-blur-[2px]"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-(--font-editorial) tracking-wide text-foreground">
                  Chapters
                </h2>
                {canEdit && (
                  <Link
                    to={`/series/${serie.id}/episodes/new`}
                    className="w-full sm:w-auto"
                  >
                    <Button className="w-full sm:w-auto bg-brand text-brand-ink font-semibold shadow-[0_12px_30px_rgba(243,213,149,0.25)] hover:bg-brand-soft">
                      New Chapter
                    </Button>
                  </Link>
                )}
              </div>

              <div className="mt-6 divide-y divide-border/60">
                {episodes.length === 0 ? (
                  <p className="text-sm text-foreground/60">No episodes yet.</p>
                ) : (
                  episodes.map((episode) => (
                    <div
                      key={episode.id}
                      className="group relative cursor-pointer rounded-2xl px-3 py-4 transition hover:bg-foreground/5 sm:px-4 sm:py-5 first:pt-0 last:pb-0"
                      onClick={() =>
                        navigate(`/series/${serie.id}/episodes/${episode.id}`)
                      }
                    >
                      <span className="absolute left-2 top-6 h-10 w-[2px] bg-gradient-to-b from-brand to-transparent opacity-0 transition group-hover:opacity-100" />
                      <div className="flex flex-col items-start justify-between gap-4 pl-4 sm:flex-row">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.35em] text-foreground/55 transition group-hover:text-brand-strong">
                            Chapter {episode.order ?? 1}
                          </p>
                          <h3 className="mt-2 text-lg md:text-xl font-semibold text-foreground transition group-hover:text-brand-strong">
                            {episode.name}
                          </h3>
                          <p className="mt-3 text-sm text-foreground/70 line-clamp-3 transition group-hover:text-foreground/90">
                            {episode.paragraph}
                          </p>
                        </div>
                        {canEdit && (
                          <div
                            className="flex flex-wrap items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link
                              to={`/series/${serie.id}/episodes/${episode.id}/edit`}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-border/60 text-foreground/80 hover:text-foreground hover:bg-foreground/5"
                              >
                                Edit
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                deleteEpisode.mutate({
                                  id: episode.id,
                                  series_id: serie.id,
                                })
                              }
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2.25rem] border border-border/60 bg-card/70 p-6 sm:p-7 md:p-9 backdrop-blur-[2px]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-foreground/50">
                    Responses
                  </p>
                  <h3 className="mt-2 text-2xl font-(--font-editorial) tracking-wide text-foreground">
                    Comments
                  </h3>
                  <p className="mt-1 text-sm text-foreground/60">
                    {displayCommentCount} comment
                    {displayCommentCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground/60">
                  <MessageSquare className="h-4 w-4" />
                  Share your thoughts
                </div>
              </div>

              <form
                className="mt-5 space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const trimmed = commentDraft.trim();
                  if (!trimmed || addComment.isPending) return;
                  addComment.mutate(
                    { seriesId: serie.id, content: trimmed },
                    { onSuccess: () => setCommentDraft("") },
                  );
                }}
              >
                <Textarea
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Write a thoughtful comment..."
                  className="min-h-[120px] rounded-2xl border-border/60 bg-background/60 text-foreground placeholder:text-foreground/40"
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-foreground/50">
                    Be respectful. Keep feedback constructive.
                  </p>
                  <Button
                    type="submit"
                    className="bg-brand text-brand-ink font-semibold shadow-[0_12px_30px_rgba(243,213,149,0.25)] hover:bg-brand-soft"
                    disabled={!commentDraft.trim() || addComment.isPending}
                  >
                    {addComment.isPending ? "Posting..." : "Post comment"}
                  </Button>
                </div>
              </form>

              <div className="mt-6 space-y-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-foreground/60">
                    No comments yet. Be the first to respond.
                  </p>
                ) : (
                  comments.map((comment) => {
                    const canDelete = comment.user_id === user?.id;
                    return (
                      <div
                        key={comment.id}
                        className="rounded-2xl border border-border/60 bg-background/60 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-9 w-9 border border-border/60">
                              {comment.author_avatar ? (
                                <AvatarImage
                                  src={comment.author_avatar}
                                  alt={comment.author_name ?? "Author"}
                                />
                              ) : (
                                <AvatarFallback>
                                  {(comment.author_name || "U")
                                    .charAt(0)
                                    .toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {comment.author_name || "Unknown"}
                              </p>
                              <p className="text-xs text-foreground/50">
                                {formatDate(comment.created_at) ?? "Just now"}
                              </p>
                            </div>
                          </div>
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border/60 text-foreground/70 hover:text-foreground hover:bg-foreground/5"
                              onClick={() =>
                                deleteComment.mutate({
                                  seriesId: serie.id,
                                  commentId: comment.id,
                                })
                              }
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                        <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </section>
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

function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] uppercase tracking-[0.35em] text-foreground/50">
        {label}
      </span>
      <span className="text-sm text-foreground/80">{value}</span>
    </div>
  );
}
