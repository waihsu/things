import { useMemo } from "react";
import { Link } from "react-router";
import {
  BookOpenText,
  FileText,
  Flag,
  Library,
  MessageSquareText,
  Settings,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { useGetSettings } from "@/src/queries/settings/api/use-get-settings";
import { useGetStories } from "@/src/queries/stories/api/use-get-stories";
import { useGetPoems } from "@/src/queries/poems/api/use-get-poems";
import { useGetSeries } from "@/src/queries/series/api/use-get-series";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/admin/components/ui/card";
import { Button } from "@/src/admin/components/ui/button";
import { Badge } from "@/src/admin/components/ui/badge";

const shortNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

export default function AdminHomePage() {
  const settingsQuery = useGetSettings();
  const storiesQuery = useGetStories({ limit: 30, includeBanned: true });
  const poemsQuery = useGetPoems({ limit: 30, includeBanned: true });
  const seriesQuery = useGetSeries({ limit: 30, includeBanned: true });

  const readsByType = useMemo(() => {
    const stories = storiesQuery.stories.reduce(
      (sum, item) => sum + (item.read_count ?? 0),
      0,
    );
    const poems = poemsQuery.poems.reduce(
      (sum, item) => sum + (item.read_count ?? 0),
      0,
    );
    const series = seriesQuery.series.reduce(
      (sum, item) => sum + (item.read_count ?? 0),
      0,
    );

    return {
      stories,
      poems,
      series,
      total: stories + poems + series,
    };
  }, [poemsQuery.poems, seriesQuery.series, storiesQuery.stories]);

  const contentMix = useMemo(() => {
    const stories = storiesQuery.totalCount;
    const poems = poemsQuery.totalCount;
    const series = seriesQuery.totalCount;
    const total = stories + poems + series;
    return { stories, poems, series, total };
  }, [poemsQuery.totalCount, seriesQuery.totalCount, storiesQuery.totalCount]);

  const trend = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }).map((_, index) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - index));
      return d;
    });

    const byDay = new Map<string, number>();
    for (const day of days) {
      byDay.set(dayKey(day), 0);
    }

    for (const item of storiesQuery.stories) {
      const key = item.created_at.slice(0, 10);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    for (const item of poemsQuery.poems) {
      const key = item.created_at.slice(0, 10);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    for (const item of seriesQuery.series) {
      const key = item.created_at.slice(0, 10);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }

    const points = days.map((day) => {
      const key = dayKey(day);
      return {
        label: day.toLocaleDateString("en-US", { weekday: "short" }),
        value: byDay.get(key) ?? 0,
      };
    });
    const max = Math.max(1, ...points.map((point) => point.value));

    return { points, max };
  }, [
    poemsQuery.poems,
    seriesQuery.series,
    storiesQuery.stories,
  ]);

  const moderationStats = useMemo(() => {
    const stories = storiesQuery.stories.filter((item) => item.is_banned).length;
    const poems = poemsQuery.poems.filter((item) => item.is_banned).length;
    const series = seriesQuery.series.filter((item) => item.is_banned).length;
    const loaded = storiesQuery.stories.length + poemsQuery.poems.length + seriesQuery.series.length;
    const banned = stories + poems + series;
    return {
      stories,
      poems,
      series,
      loaded,
      banned,
      rate: loaded > 0 ? (banned / loaded) * 100 : 0,
    };
  }, [poemsQuery.poems, seriesQuery.series, storiesQuery.stories]);

  const summary = useMemo(
    () => [
      {
        label: "Stories",
        value: storiesQuery.totalCount,
        icon: FileText,
        href: "/stories",
      },
      {
        label: "Poems",
        value: poemsQuery.totalCount,
        icon: BookOpenText,
        href: "/poems",
      },
      {
        label: "Series",
        value: seriesQuery.totalCount,
        icon: Library,
        href: "/series",
      },
      {
        label: "Total Reads",
        value: readsByType.total,
        icon: Sparkles,
        href: "/poems",
      },
    ],
    [poemsQuery.totalCount, readsByType.total, seriesQuery.totalCount, storiesQuery.totalCount],
  );

  const mixStory = contentMix.total > 0 ? (contentMix.stories / contentMix.total) * 100 : 0;
  const mixPoem = contentMix.total > 0 ? (contentMix.poems / contentMix.total) * 100 : 0;
  const donutStyle = {
    background: `conic-gradient(#f3d595 0% ${mixStory}%, #7ad0b4 ${mixStory}% ${mixStory + mixPoem}%, #93a8ff ${mixStory + mixPoem}% 100%)`,
  };

  const readSegments = [
    { label: "Stories", value: readsByType.stories, color: "bg-[#f3d595]" },
    { label: "Poems", value: readsByType.poems, color: "bg-[#7ad0b4]" },
    { label: "Series", value: readsByType.series, color: "bg-[#93a8ff]" },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Admin Console
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Control Center</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage content, review public activity, and run admin-only operations.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-foreground/80">
          <Shield className="h-3.5 w-3.5 text-brand" />
          {settingsQuery.data?.isAdmin ? "Admin Access Verified" : "Checking Admin Access"}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label} className="rounded-2xl border-border/60 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                {item.label}
                <item.icon className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-semibold">
                {typeof item.value === "number" ? shortNumber.format(item.value) : "-"}
              </p>
              <Button asChild variant="ghost" className="mt-2 h-8 px-0 text-xs">
                <Link to={item.href}>Open {item.label}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-2xl border-border/60 bg-card/80 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Publishing Trend (Last 7 Days)</CardTitle>
            <Badge variant="outline">Realtime Snapshot</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex h-52 items-end gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 pb-4 pt-6">
              {trend.points.map((point) => {
                const height = Math.max(
                  8,
                  Math.round((point.value / trend.max) * 100),
                );
                return (
                  <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="text-[11px] text-muted-foreground">{point.value}</div>
                    <div className="relative flex h-36 w-full items-end">
                      <div
                        className="w-full rounded-md bg-[linear-gradient(180deg,rgba(147,168,255,0.95),rgba(147,168,255,0.2))]"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-muted-foreground">{point.label}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg">Content Mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full p-4" style={donutStyle}>
              <div className="flex h-full w-full items-center justify-center rounded-full bg-card text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-semibold">{shortNumber.format(contentMix.total)}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#f3d595]" />Stories</span>
                <span>{shortNumber.format(contentMix.stories)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#7ad0b4]" />Poems</span>
                <span>{shortNumber.format(contentMix.poems)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#93a8ff]" />Series</span>
                <span>{shortNumber.format(contentMix.series)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg">Reads Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {readSegments.map((segment) => {
              const width =
                readsByType.total > 0 ? (segment.value / readsByType.total) * 100 : 0;
              return (
                <div key={segment.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{segment.label}</span>
                    <span>{shortNumber.format(segment.value)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/45">
                    <div
                      className={`h-full rounded-full ${segment.color}`}
                      style={{ width: `${Math.max(3, width)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg">Moderation Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Banned ratio (loaded)</p>
              <p className="mt-1 text-3xl font-semibold">{moderationStats.rate.toFixed(1)}%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {moderationStats.banned} banned / {moderationStats.loaded} loaded items
              </p>
            </div>
            <div className="space-y-1 text-sm">
              <p>Stories banned: {moderationStats.stories}</p>
              <p>Poems banned: {moderationStats.poems}</p>
              <p>Series banned: {moderationStats.series}</p>
            </div>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/moderation">
                <Flag className="mr-2 h-4 w-4" />
                Open Moderation Queue
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg">Data Coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Charts are based on latest loaded items in admin feed.</p>
            <p>Load more on content pages for deeper moderation analysis.</p>
            <div className="pt-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Open Admin Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg">Content Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/stories">Review stories</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/poems">Review poems</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/series">Review series</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg">Moderation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/moderation">
                <Flag className="mr-2 h-4 w-4" />
                Open moderation queue
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/users">
                <Users className="mr-2 h-4 w-4" />
                Review creator insights
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg">Realtime Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/chat">
                <MessageSquareText className="mr-2 h-4 w-4" />
                Open public chat room
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg">System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Open admin settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
