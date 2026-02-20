// ===========================================
// StoresPage.tsx
// ===========================================
import { Filter, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/src/things_web/components/ui/input";
import { Button } from "@/src/things_web/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/things_web/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";

import { useGetStories } from "@/src/queries/stories/api/use-get-stories";
import { useGetCategories } from "@/src/queries/categories/api/use-get-category";
import { Link } from "react-router";
import NewsCard from "@/src/interface/card/story-card";
import { useGetPresence } from "@/src/queries/presence/api/use-get-presence";

export default function StoresPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const {
    stories = [],
    isPending,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useGetStories({ limit: 9, mode: "latest" });
  const { data: categoriesData = [] } = useGetCategories();
  const authorIds = useMemo(
    () =>
      Array.from(
        new Set(
          stories
            .map((story) => story.user_id)
            .filter((userId): userId is string => Boolean(userId)),
        ),
      ),
    [stories],
  );
  const { presenceByUserId } = useGetPresence(authorIds);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    const target = loadMoreRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void fetchNextPage();
        }
      },
      { rootMargin: "280px 0px 280px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(categoriesData.map((c) => c.name).filter(Boolean))),
    ],
    [categoriesData],
  );

  const mappedStories = useMemo(() => {
    return stories.map((story) => {
      const words = (story.summary || story.content || "").split(" ").length;
      const readTime = `${Math.ceil(Math.max(words, 200) / 200)} min read`;
      return {
        id: story.id,
        title: story.title,
        summary: story.summary || "",
        category: (story.category_names || []).join(" • ") || "Uncategorized",
        author: {
          name: story.author_name || "Unknown",
          avatar: story.author_avatar || undefined,
          handle: story.author_username || story.user_id,
          userId: story.user_id,
          online: presenceByUserId[story.user_id]?.online ?? null,
          lastSeenAt: presenceByUserId[story.user_id]?.last_seen_at ?? null,
        },
        publishedAt: new Date(story.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        readTime,
        likes: story.like_count ?? 0,
        comments: story.comment_count ?? 0,
        liked: story.liked_by_me ?? false,
        trending: story.read_count > 800,
        image: undefined,
      };
    });
  }, [stories, presenceByUserId]);

  const filteredStories = mappedStories.filter((story) => {
    const matchCategory =
      activeCategory === "All" ||
      story.category.split(" • ").includes(activeCategory);
    const matchSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="relative min-h-screen w-full">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(214,170,99,0.24),transparent_45%),radial-gradient(circle_at_82%_6%,rgba(88,128,186,0.18),transparent_40%),linear-gradient(180deg,#f6f0e2,#fdf9f0)] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(224,189,127,0.2),transparent_45%),radial-gradient(circle_at_82%_6%,rgba(74,142,196,0.16),transparent_40%),linear-gradient(180deg,#080f1a,#0d1725_45%,#09111d)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(0deg,rgba(0,0,0,0.06)_1px,transparent_1px)] dark:[background-image:linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:100%_32px]" />
      </div>

      <div className="w-full space-y-10 px-3 py-10 sm:px-4 md:px-6 md:py-14 xl:px-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.5em] ">Library</p>
            <h2 className="mt-4 text-3xl md:text-4xl font-(--font-editorial) tracking-wide">
              Latest Stories
            </h2>
            <p className="mt-2 text-sm ">
              Fresh drafts from the community, curated for immersion.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
            <div className="relative w-full sm:w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/55 dark:text-white/55" />
              <Input
                placeholder="Search stories..."
                className="w-full pl-9 border-border/60 bg-background/70 text-foreground placeholder:text-foreground/45 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/45"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 border-border/60 text-foreground/75 hover:bg-foreground/5 hover:text-foreground dark:border-white/15 dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Filter className="h-4 w-4" />
            </Button>

            <Link to="/create-story" className="w-full sm:w-auto">
              <Button className="w-full bg-brand text-brand-ink font-semibold shadow-[0_12px_30px_rgba(243,213,149,0.25)] hover:bg-brand-soft sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                New Story
              </Button>
            </Link>
          </div>
        </div>

        {/* Categories */}
        <section className="rounded-[1.75rem] border border-border/60 bg-card/55 p-3 dark:border-white/10 dark:bg-white/[0.03] md:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/55 dark:text-white/55">
              Categories
            </p>
            <p className="text-xs text-foreground/45 dark:text-white/45">
              {activeCategory === "All"
                ? `${Math.max(0, categories.length - 1)} available`
                : activeCategory}
            </p>
          </div>

          <div className="w-full sm:max-w-xs">
            <Select value={activeCategory} onValueChange={setActiveCategory}>
              <SelectTrigger className="h-11 w-full rounded-2xl border-border/60 bg-background/70 text-left text-foreground dark:border-white/15 dark:bg-white/[0.04] dark:text-white">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                align="start"
                className="rounded-xl border-border/60 bg-card/95 backdrop-blur"
              >
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Stories */}
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {isPending ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center text-foreground/60 lg:col-span-2 2xl:col-span-3"
              >
                Loading stories...
              </motion.div>
            ) : isError ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center text-foreground/60 lg:col-span-2 2xl:col-span-3"
              >
                Failed to load stories
              </motion.div>
            ) : filteredStories.length ? (
              filteredStories.map((item, i) => (
                <NewsCard key={item.id} item={item} index={i} className="h-full" />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center text-foreground/60 lg:col-span-2 2xl:col-span-3"
              >
                No stories found
              </motion.div>
            )}
          </AnimatePresence>

          {hasNextPage ? (
            <div
              ref={loadMoreRef}
              className="flex min-h-14 items-center justify-center rounded-2xl border border-border/60 bg-background/70 text-sm text-foreground/55 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55 lg:col-span-2 2xl:col-span-3"
            >
              {isFetchingNextPage
                ? "Loading more stories..."
                : "Scroll to load more"}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
