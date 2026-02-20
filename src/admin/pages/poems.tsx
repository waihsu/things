import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { BookOpenText, Eye, Pencil, Search, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useGetPoems } from "@/src/queries/poems/api/use-get-poems";
import { useDeletePoem } from "@/src/queries/poems/api/use-delete-poem";
import { useBanPoem } from "@/src/queries/poems/api/use-ban-poem";
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

type SortBy = "recent" | "reads" | "title";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function AdminPoemsPage() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    poems,
    totalCount,
    totalReads,
    hasNextPage,
    fetchNextPage,
    isPending,
    isError,
    isFetchingNextPage,
    refetch,
  } = useGetPoems({ limit: 20, mode: "latest", includeBanned: true });
  const banPoemMutation = useBanPoem();

  const deletePoemMutation = useDeletePoem();

  const withTagsCount = useMemo(
    () => poems.filter((poem) => (poem.tags?.length ?? 0) > 0).length,
    [poems],
  );

  const bannedCount = useMemo(
    () => poems.filter((poem) => poem.is_banned).length,
    [poems],
  );

  const filteredPoems = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const next = poems.filter((poem) => {
      if (!normalized) return true;

      const haystack = [
        poem.title,
        poem.summary ?? "",
        poem.author_name ?? "",
        poem.author_username ?? "",
        ...(poem.category_names ?? []),
        ...(poem.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });

    return [...next].sort((a, b) => {
      if (sortBy === "reads") {
        return (b.read_count ?? 0) - (a.read_count ?? 0);
      }

      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [poems, query, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [query, sortBy]);

  const paginatedPoems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPoems.slice(start, start + pageSize);
  }, [filteredPoems, page, pageSize]);

  useEffect(() => {
    const pageCount = Math.max(1, Math.ceil(filteredPoems.length / pageSize));
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [filteredPoems.length, page, pageSize]);

  const handleDelete = async (poemId: string, title: string) => {
    const ok = window.confirm(`Delete poem \"${title}\"? This cannot be undone.`);
    if (!ok) return;

    try {
      await deletePoemMutation.mutateAsync(poemId);
      toast.success("Poem deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete poem.");
    }
  };

  const handleToggleBan = async (poemId: string, title: string, currentlyBanned: boolean) => {
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
      await banPoemMutation.mutateAsync({ id: poemId, banned: nextBanned, reason });
      toast.success(nextBanned ? "Poem banned." : "Poem unbanned.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update poem ban.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/60 bg-card/80 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Admin Library</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Poems Control</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Maintain poem quality, taxonomy, and archive consistency.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Poems</CardTitle>
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
            <CardTitle className="text-sm text-muted-foreground">Tagged Poems</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{shortNumber.format(withTagsCount)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Banned Poems</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{shortNumber.format(bannedCount)}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Poem Moderation Table</CardTitle>
            <p className="text-sm text-muted-foreground">Showing {filteredPoems.length} loaded items.</p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search poem, author, tags"
                className="pl-9 sm:w-72"
              />
            </div>

            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortBy)}
            >
              <SelectTrigger className="h-10 w-full sm:w-[170px]">
                <SelectValue placeholder="Sort poems" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="recent">Sort: Newest</SelectItem>
                <SelectItem value="reads">Sort: Most Reads</SelectItem>
                <SelectItem value="title">Sort: Title A-Z</SelectItem>
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
              Loading poems...
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-destructive">
              Failed to load poems.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Poem</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Reads</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPoems.map((poem) => (
                    <TableRow key={poem.id}>
                      <TableCell className="max-w-[360px] align-top">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{poem.title}</p>
                          {poem.is_banned ? <Badge variant="destructive">Banned</Badge> : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {poem.summary?.trim() || "No summary"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{poem.author_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">@{poem.author_username || "unknown"}</p>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <div className="flex flex-wrap gap-1">
                          {poem.tags?.length ? (
                            poem.tags.slice(0, 3).map((tag) => (
                              <Badge key={`${poem.id}-${tag}`} variant="outline">
                                #{tag}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">No tags</Badge>
                          )}
                          {(poem.tags?.length ?? 0) > 3 ? (
                            <Badge variant="secondary">+{(poem.tags?.length ?? 0) - 3}</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{shortNumber.format(poem.read_count ?? 0)}</TableCell>
                      <TableCell>{formatDate(poem.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/poems/${poem.id}`}>
                              <Eye />
                              View
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/poems/${poem.id}/edit`}>
                              <Pencil />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void handleDelete(poem.id, poem.title)}
                            disabled={deletePoemMutation.isPending}
                          >
                            <Trash2 />
                            Delete
                          </Button>
                          <Button
                            size="sm"
                            variant={poem.is_banned ? "outline" : "destructive"}
                            onClick={() => void handleToggleBan(poem.id, poem.title, poem.is_banned)}
                            disabled={banPoemMutation.isPending}
                          >
                            {poem.is_banned ? "Unban" : "Ban"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {!filteredPoems.length ? (
                <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                  No poems match your filters.
                </div>
              ) : null}

              {filteredPoems.length ? (
                <TablePagination
                  page={page}
                  pageSize={pageSize}
                  totalItems={filteredPoems.length}
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
                    {isFetchingNextPage ? "Loading more..." : "Load More Poems"}
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
            <BookOpenText className="h-4 w-4" />
            Poem ops focus: readability, tags hygiene, and archive quality.
          </div>
          <Button asChild variant="outline">
            <Link to="/moderation">
              <Tag className="h-4 w-4" />
              Open Moderation Queue
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
