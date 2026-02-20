"use client";

import { Link, useParams } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Link as LinkIcon, MapPin, User } from "lucide-react";

import { useGetPublicProfile } from "@/src/queries/profile/api/use-get-public-profile";
import { useGetPresence } from "@/src/queries/presence/api/use-get-presence";
import { useFollowActions } from "@/src/queries/follows/api/use-follow-actions";
import { useGetFollowSummary } from "@/src/queries/follows/api/use-get-follow-summary";
import { useAuthStore } from "@/src/store/use-auth-store";

import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { PresenceBadge } from "@/src/interface/presence/presence-badge";

const fallbackLinks = ["Add your portfolio", "Share your socials"];

export default function PublicProfilePage() {
  const shouldReduceMotion = useReducedMotion();
  const { handle = "" } = useParams();
  const { user } = useAuthStore();
  const { data: profile, isLoading, isError } = useGetPublicProfile(handle);
  const { presenceByUserId } = useGetPresence(profile ? [profile.user.id] : []);
  const targetUserId = profile?.user.id ?? "";
  const { data: followSummary } = useGetFollowSummary(targetUserId);
  const { follow, unfollow } = useFollowActions(targetUserId);

  const isOwner = Boolean(user && profile && user.id === profile.user.id);

  if (!handle) {
    return (
      <div className="w-full rounded-3xl border border-border/60 bg-card/80 p-8 text-center text-sm text-muted-foreground">
        Profile not found.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="h-32 animate-pulse rounded-3xl bg-muted/30" />
        <div className="h-40 animate-pulse rounded-3xl bg-muted/30" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="w-full rounded-3xl border border-border/60 bg-card/80 p-8 text-center text-sm text-muted-foreground">
        Unable to load this profile.
      </div>
    );
  }

  const displayName = profile.name || profile.user.name || "Writer";
  const authorPresence = presenceByUserId[profile.user.id];
  const location = [profile.city, profile.state, profile.country]
    .filter(Boolean)
    .join(", ");
  const links = profile.urls.length ? profile.urls : fallbackLinks;
  const isFollowing = followSummary?.is_following ?? false;
  const followersCount = followSummary?.followers_count ?? 0;
  const followingCount = followSummary?.following_count ?? 0;
  const followBusy = follow.isPending || unfollow.isPending;

  const toggleFollow = () => {
    if (!targetUserId || followBusy) return;
    if (isFollowing) {
      unfollow.mutate();
      return;
    }
    follow.mutate();
  };

  return (
    <div className="relative min-h-screen text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(243,213,149,0.2),transparent_45%),radial-gradient(circle_at_82%_12%,rgba(109,213,181,0.16),transparent_45%),linear-gradient(180deg,rgba(10,12,18,0.96),rgba(12,14,22,0.94)_40%,rgba(8,10,15,0.98))] dark:opacity-100 opacity-40" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(0deg,rgba(0,0,0,0.18)_1px,transparent_1px)] [background-size:100%_32px]" />
      </div>

      <div className="flex w-full flex-col gap-10 px-3 py-10 sm:px-4 md:px-6 md:py-12 xl:px-8">
        <motion.header
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.35)] backdrop-blur-sm md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-2 shadow-[0_15px_30px_rgba(0,0,0,0.25)]">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url || profile.user.image || "https://github.com/shadcn.png"} alt={displayName} />
                <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                Public Profile
              </p>
              <h1 className="mt-2 text-3xl font-[var(--font-editorial)] tracking-wide">
                {displayName}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>
                  Writer at Things
                  {profile.user.username ? ` · @${profile.user.username}` : ""}
                </span>
                <PresenceBadge presence={authorPresence} />
                <span className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] text-foreground/70">
                  {followersCount} followers
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isOwner ? (
              <Button asChild className="bg-brand text-brand-ink font-semibold shadow-[0_12px_30px_rgba(243,213,149,0.25)] hover:bg-brand-soft">
                <Link to="/profile">Edit profile</Link>
              </Button>
            ) : user ? (
              <Button
                variant={isFollowing ? "outline" : "default"}
                className={
                  isFollowing
                    ? "border-border/60 text-foreground/80 hover:text-foreground hover:bg-foreground/5"
                    : "bg-brand text-brand-ink font-semibold shadow-[0_12px_30px_rgba(243,213,149,0.25)] hover:bg-brand-soft"
                }
                onClick={toggleFollow}
                disabled={followBusy}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            ) : (
              <Button asChild variant="outline" className="border-border/60 text-foreground/80 hover:text-foreground hover:bg-foreground/5">
                <Link to="/login">Sign in to follow</Link>
              </Button>
            )}
          </div>
        </motion.header>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-3xl border border-border/60 bg-card/85 shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-[var(--font-editorial)]">About</CardTitle>
              <CardDescription>Discover this writer&apos;s voice and presence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm text-foreground/80">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4 leading-relaxed">
                {profile.bio?.trim() || "No bio yet. This writer is crafting their story."}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{location || "Location not shared"}</span>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Stories",
                    value: profile.stats.stories_count,
                  },
                  {
                    label: "Series",
                    value: profile.stats.series_count,
                  },
                  {
                    label: "Chapters",
                    value: profile.stats.episodes_count,
                  },
                  {
                    label: "Followers",
                    value: followersCount,
                  },
                  {
                    label: "Following",
                    value: followingCount,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-border/60 bg-background/70 p-4 text-center"
                  >
                    <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Total reads · {profile.stats.total_reads}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border/60 bg-card/85 shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl font-[var(--font-editorial)]">Links</CardTitle>
              <CardDescription>Connect with this author.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {links.map((link) => (
                <div
                  key={link}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <LinkIcon className="h-4 w-4" />
                    <span className="truncate">{link}</span>
                  </div>
                  {profile.urls.length ? (
                    <a
                      href={link.startsWith("http") ? link : `https://${link}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs uppercase tracking-[0.2em] text-foreground/70 hover:text-foreground"
                    >
                      Visit
                    </a>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
