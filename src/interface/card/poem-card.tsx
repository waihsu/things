import { motion } from "framer-motion";
import { Link } from "react-router";
import { ArrowUpRight, Eye, Sparkles } from "lucide-react";
import type { PoemItem } from "@/src/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/things_web/components/ui/avatar";
import { PresenceBadge } from "@/src/interface/presence/presence-badge";

interface PoemCardProps {
  item: PoemItem;
  index: number;
}

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export default function PoemCard({ item, index }: PoemCardProps) {
  const authorName = item.author.name || "Unknown";
  const authorInitial = authorName.slice(0, 1).toUpperCase();
  const authorHandle = item.author.handle;
  const heroTag = item.categoryNames?.[0];
  const tags = item.tags?.slice(0, 3) ?? [];
  const readsLabel = compactNumber.format(item.readCount);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      whileHover={{ y: -6 }}
      className="group relative h-full overflow-hidden rounded-[1.75rem] border border-border/60 bg-[linear-gradient(168deg,rgba(255,252,245,0.96),rgba(240,231,214,0.9))] p-5 shadow-[0_24px_60px_rgba(17,24,39,0.14)] transition-all duration-300 hover:border-brand/35 hover:shadow-[0_34px_86px_rgba(17,24,39,0.2)] dark:border-white/10 dark:bg-[linear-gradient(168deg,rgba(17,27,41,0.95),rgba(10,15,25,0.92))] dark:shadow-[0_24px_60px_rgba(0,0,0,0.42)] dark:hover:shadow-[0_34px_88px_rgba(0,0,0,0.5)] md:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_8%,rgba(214,170,99,0.24),transparent_42%),radial-gradient(circle_at_0%_100%,rgba(88,128,186,0.18),transparent_44%)] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-foreground/55">
            {item.publishedAt}
          </p>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/65 px-2.5 py-1 text-[11px] text-foreground/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/65">
            <Eye className="h-3.5 w-3.5" />
            {readsLabel} reads
          </p>
        </div>

        {heroTag || tags.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {heroTag ? (
              <span className="rounded-full border border-brand/35 bg-brand/15 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-brand">
                {heroTag}
              </span>
            ) : null}
            {tags.slice(0, heroTag ? 2 : 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border/60 bg-background/65 px-2.5 py-1 text-[11px] text-foreground/65 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/65"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        <h3 className="mt-4 text-2xl leading-tight text-foreground md:text-[2rem]">
          {item.title}
        </h3>

        <p className="mt-4 line-clamp-4 rounded-2xl border border-border/60 bg-background/70 p-4 text-sm leading-relaxed text-foreground/72 dark:border-white/10 dark:bg-white/[0.035] dark:text-white/72">
          {item.excerpt}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-4 dark:border-white/10">
          {authorHandle ? (
            <Link
              to={`/profile/${authorHandle}`}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/65 px-2 py-1 text-xs text-foreground/75 transition hover:border-brand/40 hover:text-foreground dark:border-white/15 dark:bg-white/[0.03] dark:text-white/75 dark:hover:text-white"
            >
              <Avatar className="h-7 w-7 border border-border/60 dark:border-white/15">
                <AvatarImage src={item.author.avatar || undefined} alt={authorName} />
                <AvatarFallback>{authorInitial}</AvatarFallback>
              </Avatar>
              <span className="max-w-[150px] truncate">{authorName}</span>
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
            <p className="inline-flex items-center gap-2 text-xs text-foreground/65">
              <Avatar className="h-7 w-7 border border-border/60 dark:border-white/15">
                <AvatarImage src={item.author.avatar || undefined} alt={authorName} />
                <AvatarFallback>{authorInitial}</AvatarFallback>
              </Avatar>
              <span className="max-w-[150px] truncate">{authorName}</span>
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
            </p>
          )}

          <Link
            to={`/poems/${item.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand/35 bg-brand/15 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-brand transition hover:border-brand/55 hover:bg-brand/25"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Read poem
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
