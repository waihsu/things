import { AnimatePresence, motion } from "framer-motion";
import { Filter, MoreHorizontal, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import PoemCard from "@/src/interface/card/poem-card";
import { useGetPoems } from "@/src/queries/poems/api/use-get-poems";
import { usePoemsRealtime } from "@/src/queries/poems/api/use-poems-realtime";
import { useGetPresence } from "@/src/queries/presence/api/use-get-presence";
import { useAuthStore } from "@/src/store/use-auth-store";
import { Button } from "@/src/things_web/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/things_web/components/ui/dropdown-menu";
import { Input } from "@/src/things_web/components/ui/input";

type HomeFilter = "All" | "Recent" | "Most Read";

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<HomeFilter>("All");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated, loading: authLoading } = useAuthStore();
  const canLoadPoems = !authLoading && isAuthenticated;
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { poems, isPending, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useGetPoems({ limit: 10, enabled: canLoadPoems, mode: "latest" });
  usePoemsRealtime({ enabled: canLoadPoems });
  const authorIds = useMemo(
    () =>
      Array.from(
        new Set(
          poems
            .map((poem) => poem.user_id)
            .filter((userId): userId is string => Boolean(userId)),
        ),
      ),
    [poems],
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

  const mappedPoems = useMemo(() => {
    return poems.map((poem) => {
      const createdAt = new Date(poem.created_at).getTime();
      return {
        id: poem.id,
        title: poem.title,
        excerpt:
          poem.summary?.trim() ||
          poem.content.trim().slice(0, 190) + (poem.content.trim().length > 190 ? "..." : ""),
        publishedAt: new Date(poem.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        readCount: poem.read_count ?? 0,
        author: {
          name: poem.author_name || "Unknown",
          avatar: poem.author_avatar || undefined,
          handle: poem.author_username || poem.user_id,
          userId: poem.user_id,
          online: presenceByUserId[poem.user_id]?.online ?? null,
          lastSeenAt: presenceByUserId[poem.user_id]?.last_seen_at ?? null,
        },
        tags: poem.tags ?? [],
        categoryNames: poem.category_names ?? [],
        createdAt,
      };
    });
  }, [poems, presenceByUserId]);

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    for (const poem of mappedPoems) {
      for (const tag of poem.tags) {
        if (tag?.trim()) {
          tags.add(tag);
        }
      }
    }
    return Array.from(tags).slice(0, 20);
  }, [mappedPoems]);

  const filteredPoems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const searched = mappedPoems.filter((poem) => {
      const matchesQuery =
        !q ||
        poem.title.toLowerCase().includes(q) ||
        poem.excerpt.toLowerCase().includes(q) ||
        poem.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchesTag =
        selectedTags.length === 0 || selectedTags.some((tag) => poem.tags.includes(tag));

      return matchesQuery && matchesTag;
    });

    if (activeFilter === "Most Read") {
      return [...searched].sort((a, b) => b.readCount - a.readCount);
    }

    if (activeFilter === "Recent") {
      return [...searched].sort((a, b) => b.createdAt - a.createdAt);
    }

    return searched;
  }, [activeFilter, mappedPoems, searchQuery, selectedTags]);

  const selectedTagsLabel = useMemo(() => {
    if (!selectedTags.length) {
      return "All tags";
    }
    if (selectedTags.length === 1) {
      return `#${selectedTags[0]}`;
    }
    return `${selectedTags.length} tags selected`;
  }, [selectedTags]);

  const toggleTag = (tag: string, checked: boolean) => {
    setSelectedTags((current) => {
      if (checked) {
        if (current.includes(tag)) {
          return current;
        }
        return [...current, tag];
      }
      return current.filter((item) => item !== tag);
    });
  };

  useEffect(() => {
    setSelectedTags((current) => current.filter((tag) => tagOptions.includes(tag)));
  }, [tagOptions]);

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(214,170,99,0.24),transparent_45%),radial-gradient(circle_at_82%_6%,rgba(88,128,186,0.18),transparent_40%),linear-gradient(180deg,#f6f0e2,#fdf9f0)] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(224,189,127,0.2),transparent_45%),radial-gradient(circle_at_82%_6%,rgba(74,142,196,0.16),transparent_40%),linear-gradient(180deg,#080f1a,#0d1725_45%,#09111d)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(0deg,rgba(0,0,0,0.06)_1px,transparent_1px)] dark:[background-image:linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:100%_32px]" />
      </div>

      <div className="w-full space-y-10 px-3 py-10 sm:px-4 md:px-6 md:py-14 xl:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.5em]">Library</p>
            <h2 className="mt-4 text-3xl font-(--font-editorial) tracking-wide md:text-4xl">
              Latest Poems
            </h2>
            <p className="mt-2 text-sm">
              Story page style feed, now focused on poems and short verses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/55 dark:text-white/55" />
              <Input
                placeholder="Search poems..."
                className="w-[220px] border-border/60 bg-background/70 pl-9 text-foreground placeholder:text-foreground/45 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/45"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            {tagOptions.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="max-w-[200px] border-border/60 text-foreground/75 hover:bg-foreground/5 hover:text-foreground dark:border-white/15 dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    <span className="truncate">{selectedTagsLabel}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 border-border/60 bg-background/95 backdrop-blur dark:border-white/15 dark:bg-[#12131d]/95"
                >
                  <DropdownMenuLabel>Filter by tags</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {tagOptions.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={(checked) => toggleTag(tag, Boolean(checked))}
                      className="text-foreground dark:text-white"
                    >
                      #{tag}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="w-full px-2 py-1.5 text-left text-xs text-foreground/70 hover:bg-foreground/5 dark:text-white/70 dark:hover:bg-white/10"
                  >
                    Clear all
                  </button>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            <Link to="/create-poem">
              <Button className="bg-brand font-semibold text-brand-ink shadow-[0_12px_30px_rgba(243,213,149,0.25)] hover:bg-brand-soft">
                <Plus className="mr-2 h-4 w-4" />
                New Poem
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {(["All", "Recent", "Most Read"] as HomeFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.25em] transition ${
                activeFilter === filter
                  ? "border-transparent bg-brand text-brand-ink"
                  : "border-border/60 bg-background/70 text-foreground/70 hover:bg-foreground/5 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {!authLoading && !isAuthenticated ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center text-foreground/60 sm:col-span-2 xl:col-span-3"
              >
                Sign in to browse poem feed.
              </motion.div>
            ) : null}
            {isPending ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center text-foreground/60 sm:col-span-2 xl:col-span-3"
              >
                Loading poems...
              </motion.div>
            ) : isError ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center text-foreground/60 sm:col-span-2 xl:col-span-3"
              >
                Failed to load poems
              </motion.div>
            ) : canLoadPoems && filteredPoems.length ? (
              filteredPoems.map((item, index) => <PoemCard key={item.id} item={item} index={index} />)
            ) : canLoadPoems ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center text-foreground/60 sm:col-span-2 xl:col-span-3"
              >
                No poems found
              </motion.div>
            ) : null}
          </AnimatePresence>

          {canLoadPoems && hasNextPage ? (
            <div
              ref={loadMoreRef}
              className="flex min-h-14 items-center justify-center rounded-2xl border border-border/60 bg-background/70 text-sm text-foreground/55 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55 sm:col-span-2 xl:col-span-3"
            >
              {isFetchingNextPage ? "Loading more poems..." : "Scroll to load more"}
            </div>
          ) : null}
        </div>

        {filteredPoems.length > 0 ? (
          <div className="flex justify-center pt-4">
            <Link to="/poems">
              <Button variant="ghost" className="gap-2 text-foreground/70 hover:bg-foreground/5 hover:text-foreground dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
                Open Full Poems Archive
              </Button>
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
