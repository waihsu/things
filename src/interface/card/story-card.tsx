import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Bookmark,
  Clock3,
  Flame,
  Heart,
  MessageSquare,
  Share2,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import type { StoryItem } from "@/src/types";
import { useToggleStoryLike } from "@/src/queries/stories/api/use-toggle-story-like";
import { cn } from "@/src/things_web/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/things_web/components/ui/avatar";
import { PresenceBadge } from "@/src/interface/presence/presence-badge";

interface NewsCardProps {
  item: StoryItem;
  index: number;
  className?: string;
}

export default function StoryCard({ item, index, className }: NewsCardProps) {
  const navigate = useNavigate();
  const toggleLike = useToggleStoryLike();
  const [liked, setLiked] = useState(Boolean(item.liked));
  const [likeCount, setLikeCount] = useState(item.likes);

  useEffect(() => {
    setLiked(Boolean(item.liked));
    setLikeCount(item.likes);
  }, [item.liked, item.likes]);

  const authorName = item.author.name || "Unknown";
  const authorInitial = authorName.slice(0, 1).toUpperCase();
  const categoryTokens = item.category
    .split(" • ")
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(0, 2);

  const handleLike = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (toggleLike.isPending) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));
    toggleLike.mutate(
      { storyId: item.id },
      {
        onSuccess: (data) => {
          setLiked(data.liked);
          setLikeCount(data.like_count);
        },
        onError: () => {
          setLiked((prev) => !prev);
          setLikeCount(item.likes);
        },
      },
    );
  };

  const handleComments = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    navigate(`/stories/${item.id}#comments`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      whileHover={{ y: -6 }}
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/stories/${item.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(`/stories/${item.id}`);
        }
      }}
      className={cn(
        "group relative h-full overflow-hidden rounded-[1.85rem] border border-border/60 bg-[linear-gradient(162deg,rgba(255,252,245,0.96),rgba(240,231,214,0.92))] p-5 shadow-[0_25px_65px_rgba(17,24,39,0.16)] transition-all duration-300 hover:border-brand/35 hover:shadow-[0_34px_90px_rgba(17,24,39,0.22)] dark:border-white/10 dark:bg-[linear-gradient(162deg,rgba(17,27,41,0.96),rgba(10,15,25,0.93))] dark:shadow-[0_25px_65px_rgba(0,0,0,0.42)] dark:hover:shadow-[0_34px_90px_rgba(0,0,0,0.5)] md:p-6",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_10%,rgba(214,170,99,0.24),transparent_42%),radial-gradient(circle_at_2%_98%,rgba(88,128,186,0.2),transparent_45%)] opacity-85 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/65 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-foreground/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/65">
            <Clock3 className="h-3.5 w-3.5" />
            {item.publishedAt}
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border/60 bg-background/65 px-3 py-1 text-[11px] text-foreground/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/65">
              {item.readTime}
            </span>
            {item.trending ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-brand/35 bg-brand/15 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-brand">
                <Flame className="h-3.5 w-3.5" />
                Trending
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
            <Link
              to={`/stories/${item.id}`}
              onClick={(event) => event.stopPropagation()}
              className="block text-[1.6rem] leading-tight text-foreground transition-colors group-hover:text-brand md:text-[1.75rem]"
            >
              {item.title}
            </Link>

          <p className="line-clamp-3 rounded-2xl border border-border/60 bg-background/70 p-4 text-sm leading-relaxed text-foreground/72 dark:border-white/10 dark:bg-white/[0.035] dark:text-white/72">
            {item.summary || "No description available."}
          </p>

          {categoryTokens.length ? (
            <div className="flex flex-wrap gap-2">
              {categoryTokens.map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-border/60 bg-background/65 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-foreground/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/65"
                >
                  {category}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-1 flex flex-col gap-3 border-t border-border/60 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          {item.author.handle ? (
            <Link
              to={`/profile/${item.author.handle}`}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex w-full items-center gap-2 rounded-full border border-border/60 bg-background/65 px-2 py-1 text-xs text-foreground/75 transition hover:border-brand/40 hover:text-foreground dark:border-white/15 dark:bg-white/[0.03] dark:text-white/75 dark:hover:text-white sm:w-auto sm:max-w-[70%]"
            >
              <Avatar className="h-7 w-7 border border-border/60 dark:border-white/15">
                <AvatarImage src={item.author.avatar || undefined} alt={authorName} />
                <AvatarFallback>{authorInitial}</AvatarFallback>
              </Avatar>
              <span className="truncate">{authorName}</span>
              {item.author.online !== null && item.author.online !== undefined ? (
                <PresenceBadge
                  presence={{
                    user_id: item.author.userId ?? item.author.handle ?? "",
                    online: Boolean(item.author.online),
                    last_seen_at: item.author.lastSeenAt ?? null,
                    updated_at: item.author.lastSeenAt ?? "",
                  }}
                  className="border-border/60 bg-background/70 text-foreground/70 dark:border-white/20 dark:bg-white/[0.04] dark:text-white/70"
                />
              ) : null}
            </Link>
          ) : (
            <div className="inline-flex w-full items-center gap-2 text-xs text-foreground/70 sm:w-auto sm:max-w-[70%]">
              <Avatar className="h-7 w-7 border border-border/60 dark:border-white/15">
                <AvatarImage src={item.author.avatar || undefined} alt={authorName} />
                <AvatarFallback>{authorInitial}</AvatarFallback>
              </Avatar>
              <span className="truncate">{authorName}</span>
              {item.author.online !== null && item.author.online !== undefined ? (
                <PresenceBadge
                  presence={{
                    user_id: item.author.userId ?? item.author.handle ?? "",
                    online: Boolean(item.author.online),
                    last_seen_at: item.author.lastSeenAt ?? null,
                    updated_at: item.author.lastSeenAt ?? "",
                  }}
                  className="border-border/60 bg-background/70 text-foreground/70 dark:border-white/20 dark:bg-white/[0.04] dark:text-white/70"
                />
              ) : null}
            </div>
          )}

          <div className="flex w-full flex-wrap items-center gap-1 sm:w-auto sm:justify-end">
            <button
              type="button"
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${
                liked
                  ? "border-brand/40 bg-brand/20 text-brand"
                  : "border-border/60 bg-background/65 text-foreground/65 hover:text-foreground dark:border-white/15 dark:bg-white/[0.03] dark:text-white/65 dark:hover:text-white"
              }`}
              onClick={handleLike}
            >
              <Heart className="h-3.5 w-3.5" />
              {likeCount}
            </button>

              <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/65 px-2.5 py-1 text-xs text-foreground/65 transition hover:text-foreground dark:border-white/15 dark:bg-white/[0.03] dark:text-white/65 dark:hover:text-white"
              onClick={handleComments}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {item.comments}
            </button>

            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/65 text-foreground/60 transition hover:text-foreground dark:border-white/15 dark:bg-white/[0.03] dark:text-white/60 dark:hover:text-white"
              onClick={(event) => event.stopPropagation()}
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/65 text-foreground/60 transition hover:text-foreground dark:border-white/15 dark:bg-white/[0.03] dark:text-white/60 dark:hover:text-white"
              onClick={(event) => event.stopPropagation()}
            >
              <Bookmark className="h-3.5 w-3.5" />
            </button>

            <Link
              to={`/stories/${item.id}`}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-brand/35 bg-brand/15 px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-brand transition hover:border-brand/55 hover:bg-brand/25"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Read
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
