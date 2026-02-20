import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Eye, FileText, MessageSquareText, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useGetStories } from "@/src/queries/stories/api/use-get-stories";
import { useDeleteStory } from "@/src/queries/stories/api/use-delete-story";
import { useBanStory } from "@/src/queries/stories/api/use-ban-story";
import { Badge } from "@/src/admin/components/ui/badge";
import { Button } from "@/src/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/admin/components/ui/card";
import { TablePagination } from "@/src/admin/components/table-pagination";
import { Input } from "@/src/admin/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/admin/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/admin/components/ui/table";

const shortNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

type SortBy = "recent" | "reads" | "comments";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function AdminStoriesPage() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    stories,
    totalCount,
    hasNextPage,
    fetchNextPage,
    isPending,
    isFetchingNextPage,
    isError,
    refetch,
  } = useGetStories({ limit: 20, mode: "latest", includeBanned: true });
  const banStoryMutation = useBanStory();

  const deleteStoryMutation = useDeleteStory();

  const totalReads = useMemo(
    () => stories.reduce((sum, story) => sum + (story.read_count ?? 0), 0),
    [stories],
  );

  const totalComments = useMemo(
    () => stories.reduce((sum, story) => sum + (story.comment_count ?? 0), 0),
    [stories],
  );

  const bannedCount = useMemo(
    () => stories.filter((story) => story.is_banned).length,
    [stories],
  );

  const filteredStories = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const next = stories.filter((story) => {
      if (!normalized) return true;

      const haystack = [
        story.title,
        story.summary ?? "",
        story.author_name ?? "",
        story.author_username ?? "",
        ...(story.category_names ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });

    return [...next].sort((a, b) => {
      if (sortBy === "reads") {
        return (b.read_count ?? 0) - (a.read_count ?? 0);
      }

      if (sortBy === "comments") {
        return (b.comment_count ?? 0) - (a.comment_count ?? 0);
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [query, sortBy, stories]);

  useEffect(() => {
    setPage(1);
  }, [query, sortBy]);

  const paginatedStories = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStories.slice(start, start + pageSize);
  }, [filteredStories, page, pageSize]);

  useEffect(() => {
    const pageCount = Math.max(1, Math.ceil(filteredStories.length / pageSize));
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [filteredStories.length, page, pageSize]);

  const handleDelete = async (storyId: string, title: string) => {
    const ok = window.confirm(`Delete story \"${title}\"? This cannot be undone.`);
    if (!ok) return;

    try {
      await deleteStoryMutation.mutateAsync(storyId);
      toast.success("Story deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete story.");
    }
  };

  const handleToggleBan = async (storyId: string, title: string, currentlyBanned: boolean) => {
    const nextBanned = !currentlyBanned;
    let reason: string | undefined;

    if (nextBanned) {
      const promptReason = window.prompt(`Ban reason for "${title}" (optional):`, "");
      if (promptReason === null) {
        return;
      }
      reason = promptReason.trim() || undefined;
    }

    try {
      await banStoryMutation.mutateAsync({ id: storyId, banned: nextBanned, reason });
      toast.success(nextBanned ? "Story banned." : "Story unbanned.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update story ban.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/60 bg-card/80 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Admin Library</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Stories Control</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review, update, and remove stories with moderation-focused filters.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Stories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{shortNumber.format(totalCount)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Reads (loaded)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{shortNumber.format(totalReads)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Comments (loaded)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{shortNumber.format(totalComments)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Banned Stories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{shortNumber.format(bannedCount)}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Story Moderation Table</CardTitle>
            <p className="text-sm text-muted-foreground">
              Showing {filteredStories.length} loaded items.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, author, category"
                className="pl-9 sm:w-72"
              />
            </div>

            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortBy)}
            >
              <SelectTrigger className="h-10 w-full sm:w-[170px]">
                <SelectValue placeholder="Sort stories" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="recent">Sort: Newest</SelectItem>
                <SelectItem value="reads">Sort: Most Reads</SelectItem>
                <SelectItem value="comments">Sort: Most Comments</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => void refetch()}>
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isPending ? (
            <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              Loading stories...
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-destructive">
              Failed to load stories.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Story</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead className="text-right">Reads</TableHead>
                    <TableHead className="text-right">Comments</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStories.map((story) => (
                    <TableRow key={story.id}>
                      <TableCell className="max-w-[340px] align-top">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{story.title}</p>
                          {story.is_banned ? <Badge variant="destructive">Banned</Badge> : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {story.summary?.trim() || "No summary"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{story.author_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          @{story.author_username || "unknown"}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <div className="flex flex-wrap gap-1">
                          {story.category_names?.length ? (
                            story.category_names.slice(0, 2).map((name) => (
                              <Badge key={`${story.id}-${name}`} variant="outline">
                                {name}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">Uncategorized</Badge>
                          )}
                          {(story.category_names?.length ?? 0) > 2 ? (
                            <Badge variant="secondary">+{(story.category_names?.length ?? 0) - 2}</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{shortNumber.format(story.read_count ?? 0)}</TableCell>
                      <TableCell className="text-right">
                        {shortNumber.format(story.comment_count ?? 0)}
                      </TableCell>
                      <TableCell>{formatDate(story.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/stories/${story.id}`}>
                              <Eye />
                              View
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/stories/${story.id}/edit`}>
                              <Pencil />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void handleDelete(story.id, story.title)}
                            disabled={deleteStoryMutation.isPending}
                          >
                            <Trash2 />
                            Delete
                          </Button>
                          <Button
                            size="sm"
                            variant={story.is_banned ? "outline" : "destructive"}
                            onClick={() => void handleToggleBan(story.id, story.title, story.is_banned)}
                            disabled={banStoryMutation.isPending}
                          >
                            {story.is_banned ? "Unban" : "Ban"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {!filteredStories.length ? (
                <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                  No stories match your filters.
                </div>
              ) : null}

              {filteredStories.length ? (
                <TablePagination
                  page={page}
                  pageSize={pageSize}
                  totalItems={filteredStories.length}
                  onPageChange={setPage}
                  onPageSizeChange={(next) => {
                    setPageSize(next);
                    setPage(1);
                  }}
                />
              ) : null}

              {hasNextPage ? (
                <div className="flex items-center justify-center">
                  <Button
                    variant="outline"
                    onClick={() => void fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? "Loading more..." : "Load More Stories"}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            Story ops focus: content quality, categories, and engagement cleanup.
          </div>
          <Button asChild variant="outline">
            <Link to="/moderation">
              <MessageSquareText />
              Open Moderation Queue
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
