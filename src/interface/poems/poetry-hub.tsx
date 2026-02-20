import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenText,
  Layers,
  Search,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import PoemCard from "@/src/interface/card/poem-card";
import { useGetPoems } from "@/src/queries/poems/api/use-get-poems";
import { usePoemsRealtime } from "@/src/queries/poems/api/use-poems-realtime";
import { useGetSeries } from "@/src/queries/series/api/use-get-series";
import { useGetStories } from "@/src/queries/stories/api/use-get-stories";
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

type PoetryHubProps = {
  mode?: "home" | "archive";
};

export function PoetryHub({ mode = "home" }: PoetryHubProps) {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { isAuthenticated, loading: authLoading } = useAuthStore();
  const canLoadPoems = !authLoading && isAuthenticated;
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const {
    poems,
    totalCount,
    totalReads,
    isPending,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useGetPoems({
    limit: mode === "home" ? 8 : 12,
    enabled: canLoadPoems,
  });
  usePoemsRealtime({ enabled: canLoadPoems });
  const { stories = [] } = useGetStories();
  const { series = [] } = useGetSeries();

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

  const poemItems = useMemo(() => {
    return poems.map((poem) => ({
      id: poem.id,
      title: poem.title,
      excerpt:
        poem.summary?.trim() ||
        poem.content.trim().slice(0, 190) +
          (poem.content.trim().length > 190 ? "..." : ""),
      publishedAt: new Date(poem.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      readCount: poem.read_count ?? 0,
      author: {
        name: poem.author_name || "Unknown",
        avatar: poem.author_avatar || null,
        handle: poem.author_username || poem.user_id,
      },
      tags: poem.tags ?? [],
      categoryNames: poem.category_names ?? [],
    }));
  }, [poems]);

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    for (const poem of poemItems) {
      for (const tag of poem.tags ?? []) {
        if (tag?.trim()) {
          tags.add(tag);
        }
      }
    }
    return Array.from(tags).slice(0, 24);
  }, [poemItems]);

  const filtered = poemItems.filter((poem) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      poem.title.toLowerCase().includes(q) ||
      poem.excerpt.toLowerCase().includes(q) ||
      (poem.tags ?? []).some((tag) => tag.includes(q));
    const matchesTag =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => (poem.tags ?? []).includes(tag));
    return matchesSearch && matchesTag;
  });

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

  const visiblePoems = filtered;
  const stats = [
    {
      label: "Poems",
      value: totalCount,
      helper: "curated verses",
    },
    {
      label: "Poem Reads",
      value: totalReads,
      helper: "reader visits",
    },
    {
      label: "Stories",
      value: stories.length,
      helper: "long-form drafts",
    },
    {
      label: "Series",
      value: series.length,
      helper: "ongoing arcs",
    },
  ];

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(243,213,149,0.24),transparent_40%),radial-gradient(circle_at_88%_12%,rgba(109,213,181,0.18),transparent_46%),linear-gradient(180deg,#0a0b10,#111522_50%,#0b0c12)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(0deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:100%_28px]" />
      </div>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 md:space-y-12 md:py-14">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.45)] md:p-8"
          >
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/60">
              Poetry Mode
            </p>
            <h1 className="mt-4 text-4xl font-[var(--font-editorial)] text-white md:text-6xl">
              Poems deserve the front page.
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-white/65 md:text-base">
              Title and content stay central. Keep rhythm, silence, and imagery
              in focus, then publish in one clean workflow.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                asChild
                className="bg-brand text-brand-ink font-semibold shadow-[0_12px_30px_rgba(243,213,149,0.25)] hover:bg-brand-soft"
              >
                <Link
                  to="/create-poem"
                  className="inline-flex items-center gap-2"
                >
                  <WandSparkles className="h-4 w-4" />
                  Write Poem
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/20 text-white/85 hover:bg-white/10"
              >
                <Link to="/stories" className="inline-flex items-center gap-2">
                  Story Library
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {mode === "home" ? (
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 text-white/85 hover:bg-white/10"
                >
                  <Link to="/poems" className="inline-flex items-center gap-2">
                    Open Full Archive
                    <BookOpenText className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="rounded-[2rem] border border-white/10 bg-[#0e1117]/80 p-6 shadow-[0_28px_70px_rgba(0,0,0,0.48)] md:p-8"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Studio Stats
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                >
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {item.value}
                  </p>
                  <p className="text-xs text-white/45">{item.helper}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
              <p className="inline-flex items-center gap-2 text-white/80">
                <Sparkles className="h-4 w-4 text-brand" />
                Writing cue
              </p>
              <p className="mt-2">
                Open with a striking image, close with one quiet line that
                echoes.
              </p>
            </div>
          </motion.aside>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-[var(--font-editorial)] text-white md:text-3xl">
                {mode === "home" ? "Latest Verses" : "Poetry Archive"}
              </h2>
              <p className="mt-1 text-sm text-white/60">
                Search by title, phrase, or theme.
              </p>
            </div>

            <div className="relative w-full md:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search poems..."
                className="h-11 border-white/15 bg-white/5 pl-9 text-white placeholder:text-white/35"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {tagOptions.length > 1 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:col-span-2 xl:col-span-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                    Tags
                  </p>
                  <p className="text-xs text-white/45">
                    {selectedTags.length === 0
                      ? `${tagOptions.length} available`
                      : `${selectedTags.length} selected`}
                  </p>
                </div>
                <div className="w-full sm:max-w-xs">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-11 w-full justify-between rounded-2xl border-white/15 bg-white/5 text-left text-white hover:bg-white/10"
                      >
                        <span className="truncate">{selectedTagsLabel}</span>
                        <span className="text-xs text-white/55">Multi</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="max-h-72 overflow-y-auto rounded-xl border-white/15 bg-[#111524] text-white"
                    >
                      <DropdownMenuLabel>Filter tags</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <button
                        type="button"
                        onClick={() => setSelectedTags([])}
                        className="w-full px-2 py-1.5 text-left text-sm text-white/70 transition hover:text-white"
                      >
                        Clear all
                      </button>
                      <DropdownMenuSeparator />
                      {tagOptions.map((tag) => (
                        <DropdownMenuCheckboxItem
                          key={tag}
                          checked={selectedTags.includes(tag)}
                          onCheckedChange={(checked) =>
                            toggleTag(tag, checked === true)
                          }
                        >
                          #{tag}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : null}

            <AnimatePresence mode="popLayout">
              {!authLoading && !isAuthenticated ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-10 text-center text-white/60 sm:col-span-2 xl:col-span-3"
                >
                  Sign in to view live poem feed.
                </motion.p>
              ) : null}
              {isPending ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-10 text-center text-white/60 sm:col-span-2 xl:col-span-3"
                >
                  Loading poems...
                </motion.p>
              ) : null}
              {isError ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-10 text-center text-white/60 sm:col-span-2 xl:col-span-3"
                >
                  Failed to load poems.
                </motion.p>
              ) : null}
              {!isPending && !isError && canLoadPoems && visiblePoems.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-10 text-center text-white/60 sm:col-span-2 xl:col-span-3"
                >
                  No poems found. Start your first verse.
                </motion.p>
              ) : null}
            </AnimatePresence>

            {canLoadPoems &&
              visiblePoems.map((item, index) => (
              <PoemCard key={item.id} item={item} index={index} />
              ))}

            {canLoadPoems && hasNextPage ? (
              <div
                ref={loadMoreRef}
                className="flex min-h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-white/55 sm:col-span-2 xl:col-span-3"
              >
                {isFetchingNextPage
                  ? "Loading more poems..."
                  : "Scroll to load more"}
              </div>
            ) : null}
          </div>
        </section>

        {mode === "home" ? (
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Storycraft
              </p>
              <h3 className="mt-2 text-2xl font-[var(--font-editorial)] text-white">
                Move from poem to story arc
              </h3>
              <p className="mt-2 text-sm text-white/60">
                Expand your strongest poems into longer narrative drafts and
                series.
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-4 border-white/20 text-white/85 hover:bg-white/10"
              >
                <Link
                  to="/create-story"
                  className="inline-flex items-center gap-2"
                >
                  Start Story Draft
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60">
                <Layers className="h-4 w-4" />
                Series Lab
              </p>
              <h3 className="mt-2 text-2xl font-[var(--font-editorial)] text-white">
                Plan episodic releases
              </h3>
              <p className="mt-2 text-sm text-white/60">
                Track cadence, structure arcs, and keep readers returning.
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-4 border-white/20 text-white/85 hover:bg-white/10"
              >
                <Link to="/series" className="inline-flex items-center gap-2">
                  Browse Series
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
