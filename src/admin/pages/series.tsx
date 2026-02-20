import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Eye, Layers3, MessageSquareText, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useGetSeries } from "@/src/queries/series/api/use-get-series";
import { useDeleteSerie } from "@/src/queries/series/api/use-delete-serie";
import { useBanSerie } from "@/src/queries/series/api/use-ban-serie";
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

type SortBy = "recent" | "reads" | "episodes";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function AdminSeriesPage() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    series,
    totalCount,
    hasNextPage,
    fetchNextPage,
    isPending,
    isError,
    isFetchingNextPage,
    refetch,
  } = useGetSeries({ limit: 20, mode: "latest", includeBanned: true });
  const banSeriesMutation = useBanSerie();

  const deleteSerieMutation = useDeleteSerie();

  const totalReads = useMemo(
    () => series.reduce((sum, item) => sum + (item.read_count ?? 0), 0),
    [series],
  );

  const totalEpisodes = useMemo(
    () => series.reduce((sum, item) => sum + (item.episodes_count ?? 0), 0),
    [series],
  );

  const bannedCount = useMemo(
    () => series.filter((item) => item.is_banned).length,
    [series],
  );

  const filteredSeries = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const next = series.filter((item) => {
      if (!normalized) return true;

      const haystack = [
        item.name,
        item.summary ?? "",
        item.author_name ?? "",
        item.author_username ?? "",
        ...(item.category_names ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });

    return [...next].sort((a, b) => {
      if (sortBy === "reads") {
        return (b.read_count ?? 0) - (a.read_count ?? 0);
      }

      if (sortBy === "episodes") {
        return (b.episodes_count ?? 0) - (a.episodes_count ?? 0);
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [query, series, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [query, sortBy]);

  const paginatedSeries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSeries.slice(start, start + pageSize);
  }, [filteredSeries, page, pageSize]);

  useEffect(() => {
    const pageCount = Math.max(1, Math.ceil(filteredSeries.length / pageSize));
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [filteredSeries.length, page, pageSize]);

  const handleDelete = async (seriesId: string, title: string) => {
    const ok = window.confirm(`Delete series \"${title}\"? This cannot be undone.`);
    if (!ok) return;

    try {
      await deleteSerieMutation.mutateAsync(seriesId);
      toast.success("Series deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete series.");
    }
  };

  const handleToggleBan = async (seriesId: string, title: string, currentlyBanned: boolean) => {
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
      await banSeriesMutation.mutateAsync({ id: seriesId, banned: nextBanned, reason });
      toast.success(nextBanned ? "Series banned." : "Series unbanned.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update series ban.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/60 bg-card/80 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Admin Library</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Series Control</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage long-form collections, episode health, and series performance.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Series</CardTitle>
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
            <CardTitle className="text-sm text-muted-foreground">Episodes (loaded)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{shortNumber.format(totalEpisodes)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Banned Series</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{shortNumber.format(bannedCount)}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Series Moderation Table</CardTitle>
            <p className="text-sm text-muted-foreground">Showing {filteredSeries.length} loaded items.</p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search series, author, category"
                className="pl-9 sm:w-72"
              />
            </div>

            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortBy)}
            >
              <SelectTrigger className="h-10 w-full sm:w-[170px]">
                <SelectValue placeholder="Sort series" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="recent">Sort: Newest</SelectItem>
                <SelectItem value="reads">Sort: Most Reads</SelectItem>
                <SelectItem value="episodes">Sort: Most Episodes</SelectItem>
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
              Loading series...
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-destructive">
              Failed to load series.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Series</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead className="text-right">Episodes</TableHead>
                    <TableHead className="text-right">Reads</TableHead>
                    <TableHead className="text-right">Comments</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSeries.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-[340px] align-top">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{item.name}</p>
                          {item.is_banned ? <Badge variant="destructive">Banned</Badge> : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {item.summary?.trim() || "No summary"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{item.author_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">@{item.author_username || "unknown"}</p>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <div className="flex flex-wrap gap-1">
                          {item.category_names?.length ? (
                            item.category_names.slice(0, 2).map((name) => (
                              <Badge key={`${item.id}-${name}`} variant="outline">
                                {name}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">Uncategorized</Badge>
                          )}
                          {(item.category_names?.length ?? 0) > 2 ? (
                            <Badge variant="secondary">+{(item.category_names?.length ?? 0) - 2}</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{shortNumber.format(item.episodes_count ?? 0)}</TableCell>
                      <TableCell className="text-right">{shortNumber.format(item.read_count ?? 0)}</TableCell>
                      <TableCell className="text-right">{shortNumber.format(item.comment_count ?? 0)}</TableCell>
                      <TableCell>{formatDate(item.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/series/${item.id}`}>
                              <Eye />
                              View
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/series/${item.id}/edit`}>
                              <Pencil />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void handleDelete(item.id, item.name)}
                            disabled={deleteSerieMutation.isPending}
                          >
                            <Trash2 />
                            Delete
                          </Button>
                          <Button
                            size="sm"
                            variant={item.is_banned ? "outline" : "destructive"}
                            onClick={() => void handleToggleBan(item.id, item.name, item.is_banned)}
                            disabled={banSeriesMutation.isPending}
                          >
                            {item.is_banned ? "Unban" : "Ban"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {!filteredSeries.length ? (
                <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                  No series match your filters.
                </div>
              ) : null}

              {filteredSeries.length ? (
                <TablePagination
                  page={page}
                  pageSize={pageSize}
                  totalItems={filteredSeries.length}
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
                    {isFetchingNextPage ? "Loading more..." : "Load More Series"}
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
            <Layers3 className="h-4 w-4" />
            Series ops focus: episode depth, category quality, and stale cleanup.
          </div>
          <Button asChild variant="outline">
            <Link to="/moderation">
              <MessageSquareText className="h-4 w-4" />
              Open Moderation Queue
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
