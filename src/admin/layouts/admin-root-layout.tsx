import { Link, Outlet, useLocation } from "react-router";
import {
  BookOpen,
  Flag,
  LayoutGrid,
  Library,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Toaster } from "sonner";
import { ThemeProvider } from "@/src/providers/theme-provider";
import { useAuthStore } from "@/src/store/use-auth-store";

import { Button } from "@/src/admin/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/admin/components/ui/sheet";
import { ModeToggle } from "@/src/interface/themes/mode-toggle";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutGrid },
  { path: "/stories", label: "Stories", icon: BookOpen },
  { path: "/poems", label: "Poems", icon: Library },
  { path: "/series", label: "Series", icon: Library },
  { path: "/moderation", label: "Moderation", icon: Flag },
  { path: "/users", label: "Users", icon: Users },
  { path: "/chat", label: "Chat", icon: MessageSquare },
  { path: "/settings", label: "Settings", icon: Settings },
];

const isActivePath = (pathname: string, path: string) =>
  pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));

export default function AdminRootLayout() {
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <ThemeProvider defaultTheme="dark" storageKey="admin-ui-theme">
      <div className="admin-app max-h-screen bg-background text-foreground">
        <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-64 bg-[radial-gradient(circle_at_15%_10%,rgba(243,213,149,0.24),transparent_40%),radial-gradient(circle_at_85%_12%,rgba(109,213,181,0.18),transparent_35%)]" />

        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/75 backdrop-blur-xl">
          <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center gap-3 px-3 sm:px-6">
            <Link
              to="/"
              className="group inline-flex min-w-0 items-center gap-2 rounded-2xl border border-border/60 bg-card/65 px-3 py-2"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-brand-ink">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  Things Admin
                </span>
                <span className="block truncate text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Control Panel
                </span>
              </span>
            </Link>

            <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
              {NAV_ITEMS.map((item) => {
                const active = isActivePath(pathname, item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "bg-brand text-brand-ink shadow-[0_10px_28px_rgba(243,213,149,0.45)]"
                        : "text-foreground/75 hover:bg-foreground/5 hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden max-w-[220px] truncate text-xs text-muted-foreground md:block">
                {user?.email ?? "admin"}
              </span>

              <ModeToggle />

              <Button
                size="sm"
                variant="outline"
                className="hidden border-border/60 lg:inline-flex"
                onClick={() => {
                  void logout();
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </Button>

              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border/60 lg:hidden"
                  >
                    <Menu className="h-4 w-4" />
                    Menu
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[88vw] max-w-sm border-l border-border/60"
                >
                  <SheetHeader>
                    <SheetTitle>Admin Navigation</SheetTitle>
                    <SheetDescription>
                      {user?.email ?? "admin"}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
                    {NAV_ITEMS.map((item) => {
                      const active = isActivePath(pathname, item.path);
                      return (
                        <SheetClose asChild key={item.path}>
                          <Link
                            to={item.path}
                            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${
                              active
                                ? "bg-brand text-brand-ink"
                                : "border border-border/60 bg-card/60 text-foreground/80"
                            }`}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        </SheetClose>
                      );
                    })}

                    <Button
                      size="sm"
                      variant="destructive"
                      className="mt-2"
                      onClick={() => {
                        void logout();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full h-svh ">
          <Outlet />
        </main>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
