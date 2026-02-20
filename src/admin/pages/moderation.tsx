import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, Eye, Filter, Pencil, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useDeletePoem } from "@/src/queries/poems/api/use-delete-poem";
import { useGetPoems } from "@/src/queries/poems/api/use-get-poems";
import { useDeleteSerie } from "@/src/queries/series/api/use-delete-serie";
import { useGetSeries } from "@/src/queries/series/api/use-get-series";
import { useDeleteStory } from "@/src/queries/stories/api/use-delete-story";
import { useGetStories } from "@/src/queries/stories/api/use-get-stories";
import { Badge } from "@/src/admin/components/ui/badge";
import { Button } from "@/src/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/admin/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/admin/components/ui/table";

type ContentKind = "story" | "poem" | "series";
type QueueFilter = "all" | "flagged" | ContentKind;

type QueueItem = {
  id: string;
  title: string;
  kind: ContentKind;
  authorName: string;
  authorHandle: string | null;
  categories: string[];
  summary: string | null;
  reads: number;
  comments: number;
  createdAt: string;
  detailPath: string;
  editPath: string;
  episodesCount?: number;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const assessFlags = (item: QueueItem) => {
  const flags: string[] = [];

  if (!item.summary?.trim()) {
    flags.push("Missing summary");
  }

  if (!item.categories.length) {
    flags.push("Uncategorized");
  }

  const ageInDays = Math.floor(
    (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (item.reads === 0 && ageInDays >= 3) {
    flags.push("Zero engagement");
  }

  if (item.kind === "series" && (item.episodesCount ?? 0) === 0) {
    flags.push("No episodes");
  }

  return flags;
};

export default function ModerationPage() {
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("flagged");

  const storiesQuery = useGetStories({ limit: 12, mode: "latest" });
  const poemsQuery = useGetPoems({ limit: 12, mode: "latest" });
  const seriesQuery = useGetSeries({ limit: 12, mode: "latest" });

  const deleteStoryMutation = useDeleteStory();
  const deletePoemMutation = useDeletePoem();
  const deleteSeriesMutation = useDeleteSerie();

  const queueItems = useMemo<QueueItem[]>(() => {
    const storyItems: QueueItem[] = storiesQuery.stories.map((story) => ({
      id: story.id,
      title: story.title,
      kind: "story",
      authorName: story.author_name || "Unknown",
      authorHandle: story.author_username,
      categories: story.category_names || [],
      summary: story.summary,
      reads: story.read_count ?? 0,
      comments: story.comment_count ?? 0,
      createdAt: story.created_at,
      detailPath: `/stories/${story.id}`,
      editPath: `/stories/${story.id}/edit`,
    }));

    const poemItems: QueueItem[] = poemsQuery.poems.map((poem) => ({
      id: poem.id,
      title: poem.title,
      kind: "poem",
      authorName: poem.author_name || "Unknown",
      authorHandle: poem.author_username,
      categories: poem.category_names || [],
      summary: poem.summary,
      reads: poem.read_count ?? 0,
      comments: 0,
      createdAt: poem.created_at,
      detailPath: `/poems/${poem.id}`,
      editPath: `/poems/${poem.id}/edit`,
    }));

    const seriesItems: QueueItem[] = seriesQuery.series.map((item) => ({
      id: item.id,
      title: item.name,
      kind: "series",
      authorName: item.author_name || "Unknown",
      authorHandle: item.author_username,
      categories: item.category_names || [],
      summary: item.summary,
      reads: item.read_count ?? 0,
      comments: item.comment_count ?? 0,
      createdAt: item.created_at,
      detailPath: `/series/${item.id}`,
      editPath: `/series/${item.id}/edit`,
      episodesCount: item.episodes_count ?? 0,
    }));

    return [...storyItems, ...poemItems, ...seriesItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [poemsQuery.poems, seriesQuery.series, storiesQuery.stories]);

  const flaggedCount = useMemo(
    () => queueItems.filter((item) => assessFlags(item).length > 0).length,
    [queueItems],
  );

  const filteredItems = useMemo(() => {
    return queueItems.filter((item) => {
      if (queueFilter === "all") return true;
      if (queueFilter === "flagged") return assessFlags(item).length > 0;
      return item.kind === queueFilter;
    });
  }, [queueFilter, queueItems]);

  const isLoading = storiesQuery.isPending || poemsQuery.isPending || seriesQuery.isPending;
  const isError = storiesQuery.isError || poemsQuery.isError || seriesQuery.isError;

  const handleRemove = async (item: QueueItem) => {
    const ok = window.confirm(
      `Remove ${item.kind} \"${item.title}\"? This cannot be undone.`,
    );
    if (!ok) return;

    try {
      if (item.kind === "story") {
        await deleteStoryMutation.mutateAsync(item.id);
      } else if (item.kind === "poem") {
        await deletePoemMutation.mutateAsync(item.id);
      } else {
        await deleteSeriesMutation.mutateAsync(item.id);
      }
      toast.success(`${item.kind[0]?.toUpperCase()}${item.kind.slice(1)} deleted.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete content.");
    }
  };

  const loadingMore =
    storiesQuery.isFetchingNextPage || poemsQuery.isFetchingNextPage || seriesQuery.isFetchingNextPage;

  const hasMore =
    Boolean(storiesQuery.hasNextPage) ||
    Boolean(poemsQuery.hasNextPage) ||
    Boolean(seriesQuery.hasNextPage);

  const loadMoreAll = async () => {
    await Promise.all([
      storiesQuery.hasNextPage ? storiesQuery.fetchNextPage() : Promise.resolve(),
      poemsQuery.hasNextPage ? poemsQuery.fetchNextPage() : Promise.resolve(),
      seriesQuery.hasNextPage ? seriesQuery.fetchNextPage() : Promise.resolve(),
    ]);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/60 bg-card/80 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Admin Safety</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Moderation Queue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Central queue for reviewing risky, incomplete, or low-quality content.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Loaded Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{queueItems.length}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Flagged Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{flaggedCount}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Queue Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 pt-0">
            <ShieldAlert className="h-4 w-4 text-brand" />
            <p className="text-sm text-muted-foreground">
              {flaggedCount > 0 ? "Needs review" : "Healthy"}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Review Feed</CardTitle>
            <p className="text-sm text-muted-foreground">Cross-content moderation stream.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              size="sm"
              variant={queueFilter === "flagged" ? "default" : "outline"}
              onClick={() => setQueueFilter("flagged")}
            >
              Flagged
            </Button>
            <Button
              size="sm"
              variant={queueFilter === "all" ? "default" : "outline"}
              onClick={() => setQueueFilter("all")}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={queueFilter === "story" ? "default" : "outline"}
              onClick={() => setQueueFilter("story")}
            >
              Stories
            </Button>
            <Button
              size="sm"
              variant={queueFilter === "poem" ? "default" : "outline"}
              onClick={() => setQueueFilter("poem")}
            >
              Poems
            </Button>
            <Button
              size="sm"
              variant={queueFilter === "series" ? "default" : "outline"}
              onClick={() => setQueueFilter("series")}
            >
              Series
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              Loading moderation queue...
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-destructive">
              Failed to load moderation queue.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead className="text-right">Reads</TableHead>
                    <TableHead className="text-right">Comments</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const flags = assessFlags(item);

                    return (
                      <TableRow key={`${item.kind}-${item.id}`}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.kind}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[320px] align-top">
                          <p className="truncate font-medium">{item.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {item.summary?.trim() || "No summary"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{item.authorName}</p>
                          <p className="text-xs text-muted-foreground">@{item.authorHandle || "unknown"}</p>
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <div className="flex flex-wrap gap-1">
                            {flags.length ? (
                              flags.map((flag) => (
                                <Badge key={`${item.kind}-${item.id}-${flag}`} variant="destructive">
                                  <AlertTriangle className="h-3 w-3" />
                                  {flag}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="secondary">Healthy</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.reads}</TableCell>
                        <TableCell className="text-right">{item.comments}</TableCell>
                        <TableCell>{formatDate(item.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link to={item.detailPath}>
                                <Eye />
                                View
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link to={item.editPath}>
                                <Pencil />
                                Edit
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => void handleRemove(item)}
                              disabled={
                                deleteStoryMutation.isPending ||
                                deletePoemMutation.isPending ||
                                deleteSeriesMutation.isPending
                              }
                            >
                              <Trash2 />
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {!filteredItems.length ? (
                <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                  No content in this moderation filter.
                </div>
              ) : null}

              {hasMore ? (
                <div className="flex items-center justify-center">
                  <Button variant="outline" onClick={() => void loadMoreAll()} disabled={loadingMore}>
                    {loadingMore ? "Loading more..." : "Load More Queue Items"}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
