import { useEffect, useMemo, useState } from "react";
import { Activity, Search, ShieldCheck, UserRound, Users } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";

import { useGetAdminUsers } from "@/src/queries/profile/api/use-get-admin-users";
import { useBanUser } from "@/src/queries/profile/api/use-ban-user";
import { useGetPresence } from "@/src/queries/presence/api/use-get-presence";
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

type SortBy = "recent" | "activity" | "name";

const shortNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatDate = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function UsersPage() {
  const [queryInput, setQueryInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(queryInput.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [queryInput]);

  useEffect(() => {
    setPage(1);
  }, [search, sortBy]);

  const {
    users,
    totalCount,
    isPending,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useGetAdminUsers({
    limit: 100,
    search,
    sortBy,
  });
  const banUserMutation = useBanUser();

  const userIds = useMemo(() => users.map((item) => item.id), [users]);
  const { presenceByUserId } = useGetPresence(userIds);

  const onlineCount = useMemo(
    () => users.filter((item) => presenceByUserId[item.id]?.online).length,
    [presenceByUserId, users],
  );

  const bannedCount = useMemo(
    () => users.filter((item) => item.banned).length,
    [users],
  );

  const adminCount = useMemo(
    () => users.filter((item) => item.role === "admin").length,
    [users],
  );

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return users.slice(start, start + pageSize);
  }, [page, pageSize, users]);

  useEffect(() => {
    const pageCount = Math.max(1, Math.ceil(users.length / pageSize));
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageSize, users.length]);

  const handleToggleUserBan = async (
    userId: string,
    label: string,
    currentlyBanned: boolean,
  ) => {
    const nextBanned = !currentlyBanned;
    let reason: string | undefined;

    if (nextBanned) {
      const promptReason = window.prompt(`Ban reason for "${label}" (optional):`, "");
      if (promptReason === null) {
        return;
      }
      reason = promptReason.trim() || undefined;
    }

    try {
      await banUserMutation.mutateAsync({ id: userId, banned: nextBanned, reason });
      toast.success(nextBanned ? "User banned." : "User unbanned.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user ban.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/60 bg-card/80 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Admin Directory</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Users Control</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Full account directory with role, activity, and content footprint.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 pt-0">
            <Users className="h-4 w-4 text-brand" />
            <p className="text-3xl font-semibold">{shortNumber.format(totalCount)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Loaded Rows</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 pt-0">
            <UserRound className="h-4 w-4 text-brand" />
            <p className="text-3xl font-semibold">{shortNumber.format(users.length)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Online (Loaded)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 pt-0">
            <Activity className="h-4 w-4 text-emerald-500" />
            <p className="text-3xl font-semibold">{shortNumber.format(onlineCount)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Admins / Banned</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 pt-0">
            <ShieldCheck className="h-4 w-4 text-brand" />
            <p className="text-3xl font-semibold">
              {shortNumber.format(adminCount)} / {shortNumber.format(bannedCount)}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Accounts Table</CardTitle>
            <p className="text-sm text-muted-foreground">Search all users and inspect role/activity.</p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder="Search name, username, email, id"
                className="pl-9 sm:w-80"
              />
            </div>

            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortBy)}
            >
              <SelectTrigger className="h-10 w-full sm:w-[170px]">
                <SelectValue placeholder="Sort users" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="recent">Sort: Newest</SelectItem>
                <SelectItem value="activity">Sort: Activity</SelectItem>
                <SelectItem value="name">Sort: Name A-Z</SelectItem>
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
              Loading users...
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-destructive">
              Failed to load users.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden lg:table-cell">Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Stories</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Poems</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Series</TableHead>
                    <TableHead className="text-right">Reads</TableHead>
                    <TableHead className="hidden lg:table-cell">Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedUsers.map((item) => {
                    const presence = presenceByUserId[item.id];
                    const isOnline = Boolean(presence?.online);
                    const usernameOrId = item.username || item.id;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="align-top">
                          <p className="font-medium">{item.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">@{usernameOrId}</p>
                        </TableCell>

                        <TableCell className="hidden max-w-[220px] truncate lg:table-cell">
                          {item.email || "-"}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant={item.role === "admin" ? "default" : "outline"}>
                              {item.role === "admin" ? "Admin" : "User"}
                            </Badge>
                            <Badge variant={item.banned ? "destructive" : "secondary"}>
                              {item.banned ? "Banned" : "Active"}
                            </Badge>
                            <Badge variant={isOnline ? "secondary" : "outline"}>
                              {isOnline ? "Online" : "Offline"}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell className="hidden text-right md:table-cell">{item.stories_count}</TableCell>
                        <TableCell className="hidden text-right md:table-cell">{item.poems_count}</TableCell>
                        <TableCell className="hidden text-right md:table-cell">{item.series_count}</TableCell>
                        <TableCell className="text-right">{shortNumber.format(item.total_reads)}</TableCell>
                        <TableCell className="hidden lg:table-cell">{formatDate(item.last_active_at)}</TableCell>

                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant={item.banned ? "outline" : "destructive"}
                              onClick={() =>
                                void handleToggleUserBan(
                                  item.id,
                                  item.name || item.username || item.id,
                                  item.banned,
                                )
                              }
                              disabled={banUserMutation.isPending}
                            >
                              {item.banned ? "Unban" : "Ban"}
                            </Button>
                            {item.username ? (
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/profile/${encodeURIComponent(item.username)}`}>Profile</Link>
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" disabled>
                                Profile
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {!users.length ? (
                <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                  No users found.
                </div>
              ) : null}

              {users.length ? (
                <TablePagination
                  page={page}
                  pageSize={pageSize}
                  totalItems={users.length}
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
                    {isFetchingNextPage ? "Loading more..." : "Load More Users"}
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
