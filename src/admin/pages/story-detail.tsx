import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Heart,
  MessageSquare,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/src/things_web/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/things_web/components/ui/avatar";
import { Textarea } from "@/src/things_web/components/ui/textarea";
import { useGetStory } from "@/src/queries/stories/api/use-get-story";
import { useDeleteStory } from "@/src/queries/stories/api/use-delete-story";
import { useGetStoryComments } from "@/src/queries/stories/api/use-get-story-comments";
import { useAddStoryComment } from "@/src/queries/stories/api/use-add-story-comment";
import { useDeleteStoryComment } from "@/src/queries/stories/api/use-delete-story-comment";
import { useToggleStoryLike } from "@/src/queries/stories/api/use-toggle-story-like";
import { useIncrementStoryRead } from "@/src/queries/stories/api/use-increment-story-read";
import { useGetPresence } from "@/src/queries/presence/api/use-get-presence";
import { useAuthStore } from "@/src/store/use-auth-store";
import { PresenceBadge } from "@/src/interface/presence/presence-badge";

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export default function StoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: story, isLoading, isError } = useGetStory(id || "");
  const deleteStory = useDeleteStory();
  const { data: comments = [] } = useGetStoryComments(id || "");
  const addComment = useAddStoryComment();
  const deleteComment = useDeleteStoryComment();
  const toggleLike = useToggleStoryLike();
  const incrementRead = useIncrementStoryRead();
  const { presenceByUserId } = useGetPresence(story ? [story.user_id] : []);
  const [commentDraft, setCommentDraft] = useState("");
  const hasIncremented = useRef(false);

  useEffect(() => {
    if (!id || !story?.id || hasIncremented.current) return;
    hasIncremented.current = true;
    incrementRead.mutate({ storyId: story.id });
  }, [id, story?.id, incrementRead]);

  if (!id) return <div className="p-6">Invalid story.</div>;
  if (isLoading) return <div className="p-6">Loading story...</div>;
  if (isError || !story) return <div className="p-6">Story not found.</div>;

  const canEdit = user?.id === story.user_id;
  const authorName = story.author_name || "Unknown";
  const authorPresence = presenceByUserId[story.user_id];
  const authorHandle = story.author_username || story.user_id;
  const authorInitial = authorName.slice(0, 1).toUpperCase();
  const wordCount = story.content.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(Math.max(wordCount, 120) / 200));
  const createdAt = formatDate(story.created_at);
  const updatedAt = formatDate(story.updated_at);
  const categories = story.category_names || [];
  const likeCount = story.like_count ?? 0;
  const commentCount = story.comment_count ?? 0;
  const likedByMe = Boolean(story.liked_by_me);
  const displayCommentCount = comments.length || commentCount;
  const readsLabel = compactNumber.format(story.read_count ?? 0);
  const lines = story.content.split("\n");

  return (
    <div className="relative min-h-screen text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(243,213,149,0.24),transparent_42%),radial-gradient(circle_at_90%_8%,rgba(109,213,181,0.18),transparent_40%),linear-gradient(180deg,#fbf7ef,#fefcf8)] dark:bg-[radial-gradient(circle_at_16%_10%,rgba(244,208,131,0.18),transparent_42%),radial-gradient(circle_at_90%_8%,rgba(109,213,181,0.14),transparent_40%),linear-gradient(180deg,#0b0c12,#10131d_45%,#0b0d12)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(0deg,rgba(0,0,0,0.06)_1px,transparent_1px)] dark:[background-image:linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:100%_30px]" />
      </div>

      <div className="mx-auto  px-4 py-10 md:py-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/stories"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-xs uppercase tracking-[0.24em] text-foreground/70 transition hover:text-foreground hover:border-border"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to stories
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className={`border transition-colors ${
                likedByMe
                  ? "border-brand/50 bg-brand text-[#1b1207] hover:bg-brand-soft dark:border-brand/60 dark:bg-brand dark:text-[#1b1207]"
                  : "border-border/60 bg-background/70 text-foreground/80 hover:text-foreground hover:bg-background dark:border-white/20 dark:bg-white/[0.03] dark:text-white/75 dark:hover:bg-white/[0.08] dark:hover:text-white"
              }`}
              onClick={() => toggleLike.mutate({ storyId: story.id })}
            >
              <Heart className="h-4 w-4" />
              {likeCount}
            </Button>
            {canEdit ? (
              <>
                <Link to={`/stories/${story.id}/edit`}>
                  <Button
                    variant="outline"
                    className="border-border/60 text-foreground/80 hover:text-foreground hover:bg-foreground/5"
                  >
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  onClick={() =>
                    deleteStory.mutate(story.id, {
                      onSuccess: () => navigate("/stories"),
                    })
                  }
                  disabled={deleteStory.isPending}
                >
                  {deleteStory.isPending ? "Deleting..." : "Delete"}
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[0.22fr_0.56fr_0.22fr]">
          <aside className="order-2 lg:order-1">
            <div className="space-y-5 lg:sticky lg:top-24">
              <div className="rounded-[1.75rem] border border-border/60 bg-card/75 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
                <p className="text-[11px] uppercase tracking-[0.35em] text-foreground/55">
                  Author
                </p>
                <Link
                  to={`/profile/${authorHandle}`}
                  className="mt-4 inline-flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-background/35 px-3 py-3 transition hover:border-brand/40"
                >
                  <Avatar className="h-11 w-11 border border-border/60">
                    <AvatarImage
                      src={story.author_avatar || undefined}
                      alt={authorName}
                    />
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
              </div>

              <div className="rounded-[1.75rem] border border-border/60 bg-card/70 p-5">
                <p className="text-[11px] uppercase tracking-[0.35em] text-foreground/55">
                  Story Metrics
                </p>
                <div className="mt-4 space-y-3 text-sm text-foreground/75">
                  <MetaRow icon={Sparkles} label="Reads" value={readsLabel} />
                  <MetaRow
                    icon={Clock3}
                    label="Read time"
                    value={`${readTime} min`}
                  />
                  <MetaRow
                    icon={MessageSquare}
                    label="Word count"
                    value={wordCount}
                  />
                  {createdAt ? (
                    <MetaRow
                      icon={CalendarDays}
                      label="Published"
                      value={createdAt}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </aside>

          <article className="order-1 rounded-[2.35rem] border border-border/60 bg-card/80 px-7 pb-10 pt-8 shadow-[0_36px_90px_rgba(0,0,0,0.28)] backdrop-blur-[2px] dark:bg-[#0e1117]/90 md:px-10 md:pt-10 lg:order-2">
            <p className="text-[11px] uppercase tracking-[0.4em] text-foreground/50">
              Story
            </p>
            <h1 className="mt-4 text-4xl leading-tight tracking-wide md:text-5xl">
              {story.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {categories.length ? (
                categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-border/60 bg-card/75 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-foreground/72"
                  >
                    {category}
                  </span>
                ))
              ) : (
                <span className="text-sm text-foreground/60">
                  Uncategorized
                </span>
              )}
            </div>

            {story.summary ? (
              <div className="mt-6 rounded-2xl border border-border/60 bg-card/70 p-5 text-foreground/82 leading-relaxed">
                {story.summary}
              </div>
            ) : null}

            <div className="mt-8 border-t border-border/60 pt-8 space-y-4 text-lg leading-[1.9] text-foreground/90">
              {lines.map((rawLine, idx) => {
                const line = rawLine.trimEnd();
                if (idx === 0 && line) {
                  return (
                    <p key={`${story.id}-${idx}`}>
                      <span className="float-left mr-3 mt-1 text-5xl font-[var(--font-editorial)] text-brand">
                        {line[0]}
                      </span>
                      {line.slice(1)}
                    </p>
                  );
                }
                return <p key={`${story.id}-${idx}`}>{line || "\u00A0"}</p>;
              })}
            </div>

            <section
              id="comments"
              className="mt-12 rounded-3xl border border-border/60 bg-card/70 p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-foreground/50">
                    Responses
                  </p>
                  <h3 className="mt-2 text-xl text-foreground">Comments</h3>
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
                    { storyId: story.id, content: trimmed },
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
                    const commentAuthor = comment.author_name || "Unknown";
                    return (
                      <div
                        key={comment.id}
                        className="rounded-2xl border border-border/60 bg-background/60 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <Link
                            to={`/profile/${comment.user_id}`}
                            className="flex items-start gap-3"
                          >
                            <Avatar className="h-9 w-9 border border-border/60">
                              {comment.author_avatar ? (
                                <AvatarImage
                                  src={comment.author_avatar}
                                  alt={commentAuthor}
                                />
                              ) : (
                                <AvatarFallback>
                                  {commentAuthor.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold text-foreground hover:text-brand-strong">
                                {commentAuthor}
                              </p>
                              <p className="text-xs text-foreground/50">
                                {formatDate(comment.created_at) ?? "Just now"}
                              </p>
                            </div>
                          </Link>

                          {canDelete ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border/60 text-foreground/70 hover:text-foreground hover:bg-foreground/5"
                              onClick={() =>
                                deleteComment.mutate({
                                  storyId: story.id,
                                  commentId: comment.id,
                                })
                              }
                            >
                              Delete
                            </Button>
                          ) : null}
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

            <div className="mt-12 border-t border-border/60 pt-6 text-xs uppercase tracking-[0.3em] text-foreground/50 flex justify-between">
              <span>End of story</span>
              <span>Thanks for reading</span>
            </div>
          </article>

          <aside className="order-3">
            <div className="space-y-5 lg:sticky lg:top-24">
              <div className="rounded-[1.75rem] border border-border/60 bg-card/70 p-5">
                <p className="text-[11px] uppercase tracking-[0.35em] text-foreground/55">
                  Story Notes
                </p>
                <div className="mt-3 space-y-2 text-sm text-foreground/72">
                  <p>
                    {story.summary?.trim() ||
                      "No summary yet. The story body carries the full arc."}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border/60 bg-card/70 p-5">
                <p className="text-[11px] uppercase tracking-[0.35em] text-foreground/55">
                  Timeline
                </p>
                <div className="mt-3 space-y-2 text-sm text-foreground/72">
                  <p>
                    {createdAt
                      ? `Published ${createdAt}`
                      : "Published date unavailable"}
                  </p>
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
