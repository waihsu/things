import {
  CircleUserRound,
  Compass,
  LayoutGrid,
  LogIn,
  LogOut,
  MessageCircleMore,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";
import { ThemeProvider } from "@/src/providers/theme-provider";
import { Toaster } from "sonner";
import { useAuthStore } from "@/src/store/use-auth-store";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ModeToggle } from "../components/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const navItems = [
  { to: "/chat", label: "Hub", icon: LayoutGrid, matchPrefix: false },
  {
    to: "/chat/public",
    label: "Public",
    icon: MessageCircleMore,
    matchPrefix: false,
  },
  { to: "/chat/dm", label: "Direct", icon: UsersRound, matchPrefix: true },
  { to: "/chat/people", label: "People", icon: UserRound, matchPrefix: false },
  { to: "/about", label: "About", icon: Compass },
];

export default function ChatShellLayout() {
  const { pathname } = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();

  const profileHref = isAuthenticated ? "/profile" : "/login";
  const profileLabel = isAuthenticated ? "Profile" : "Sign In";

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="chat-app min-h-screen bg-[radial-gradient(circle_at_12%_8%,rgba(245,214,151,0.22),transparent_38%),radial-gradient(circle_at_86%_6%,rgba(122,208,180,0.18),transparent_32%),linear-gradient(180deg,#faf5eb,#fffdf9)] text-foreground dark:bg-[radial-gradient(circle_at_12%_8%,rgba(245,214,151,0.18),transparent_40%),radial-gradient(circle_at_86%_6%,rgba(122,208,180,0.16),transparent_35%),linear-gradient(180deg,#07090f,#0d1220_45%,#090d17)] dark:text-white">
        <div className="mx-auto flex min-h-screen w-full">
          <aside className="hidden w-[290px] flex-col border-r border-border/60 bg-background/60 p-4 backdrop-blur md:flex dark:border-white/10 dark:bg-white/[0.03]">
            <Link
              to="/chat"
              className="rounded-2xl border border-border/60 bg-background/80 p-4 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <p className="text-[10px] uppercase tracking-[0.34em] text-foreground/55 dark:text-white/55">
                Things
              </p>
              <h1 className="mt-2 text-2xl font-semibold">Chat App</h1>
              <p className="mt-1 text-sm text-foreground/65 dark:text-white/65">
                Realtime public space
              </p>
            </Link>

            <nav className="mt-4 space-y-1">
              {navItems.map((item) => {
                const active = item.matchPrefix
                  ? pathname === item.to || pathname.startsWith(`${item.to}/`)
                  : pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-brand text-brand-ink shadow-[0_10px_24px_rgba(243,213,149,0.25)]"
                        : "text-foreground/75 hover:bg-foreground/5 hover:text-foreground dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto rounded-2xl border border-border/60 bg-background/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-border/60 dark:border-white/15">
                  <AvatarImage src={user?.image} />
                  <AvatarFallback>{user?.name?.[0] ?? "G"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {user?.name || "Guest user"}
                  </p>
                  <p className="truncate text-xs text-foreground/60 dark:text-white/60">
                    {user?.email || "Not signed in"}
                  </p>
                </div>
                <ModeToggle />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <Link to={profileHref}>
                    {isAuthenticated ? (
                      <UserRound className="h-4 w-4" />
                    ) : (
                      <LogIn className="h-4 w-4" />
                    )}
                    {profileLabel}
                  </Link>
                </Button>
                {isAuthenticated ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      void logout();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                ) : (
                  <Button
                    asChild
                    size="sm"
                    className="justify-start bg-brand text-brand-ink hover:bg-brand-soft"
                  >
                    <Link to="/login">
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/75 px-4 py-3 backdrop-blur md:hidden dark:border-white/10 dark:bg-black/35">
              <Link to="/chat" className="inline-flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-background/75 dark:border-white/15 dark:bg-white/[0.04]">
                  <MessageCircleMore className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold">Things Chat</span>
              </Link>
              <div className="flex items-center gap-2">
                <ModeToggle />
                <Button asChild size="icon-sm" variant="outline">
                  <Link to={profileHref}>
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Avatar className="h-9 w-9 border border-border/60 dark:border-white/15">
                            <AvatarImage src={user?.image} />
                            <AvatarFallback>
                              {user?.name?.[0] ?? "U"}
                            </AvatarFallback>
                          </Avatar>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="end"
                          className="w-44 border-border/80 bg-card/95 backdrop-blur-xl"
                        >
                          <DropdownMenuItem asChild>
                            <Link to="/profile">Profile</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/settings">Settings</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                    <span className="sr-only">{profileLabel}</span>
                  </Link>
                </Button>
              </div>
            </header>

            <main className="chat-main min-h-0 flex-1 px-2 pb-[86px] pt-2 sm:px-3 sm:pt-3 md:p-5 md:pb-5">
              <Outlet />
            </main>
          </div>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden dark:border-white/10 dark:bg-black/45">
          <div className="grid grid-cols-4 gap-1">
            {navItems.slice(0, 4).map((item) => {
              const active = item.matchPrefix
                ? pathname === item.to || pathname.startsWith(`${item.to}/`)
                : pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] ${
                    active
                      ? "bg-brand text-brand-ink"
                      : "text-foreground/70 hover:bg-foreground/5 dark:text-white/70 dark:hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <Toaster />
      </div>
    </ThemeProvider>
  );
}
