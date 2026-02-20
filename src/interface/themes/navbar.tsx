import { Button } from "@/src/things_web/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/things_web/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/things_web/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/things_web/components/ui/sheet";
import { LogOut, Menu } from "lucide-react";
import { useAuthStore } from "@/src/store/use-auth-store";
import { Link, useLocation } from "react-router";

import { APP_ROUTES } from "@/src/constants/routes";
import { ModeToggle } from "./mode-toggle";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { pathname } = useLocation();

  const navItems = APP_ROUTES.filter((route) =>
    ["/", "/stories", "/series", "/chat", "/about", "/settings"].includes(
      route.path,
    ),
  );

  const isActiveRoute = (routePath: string) => {
    if (routePath === "/") {
      return pathname === "/";
    }
    return pathname === routePath || pathname.startsWith(`${routePath}/`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/72 backdrop-blur-xl supports-[backdrop-filter]:bg-background/62">
      <div className="flex h-16 w-full items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-border/80 bg-card/85 shadow-[0_12px_26px_rgba(12,18,30,0.22)]">
            <span className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(243,213,149,0.45),transparent_55%)]" />
            <span className="relative z-10 text-sm font-bold text-brand">
              T
            </span>
          </span>
          <div>
            <p className="text-sm font-semibold tracking-wide text-foreground transition-colors group-hover:text-brand">
              Things
            </p>
            <p className="text-[10px] uppercase tracking-[0.35em] text-foreground/50">
              Library
            </p>
          </div>
        </Link>

        <nav className="premium-panel hidden items-center gap-1 rounded-full border-border/80 px-1.5 py-1 md:flex">
          {navItems.map((route) => {
            const active = isActiveRoute(route.path);
            const itemClass = `rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.3em] transition ${
              active
                ? "bg-brand text-brand-ink shadow-[0_10px_28px_rgba(201,158,84,0.38)]"
                : "text-foreground/70 hover:bg-foreground/6 hover:text-foreground"
            }`;
            return (
              <Link key={route.path} to={route.path} className={itemClass}>
                {route.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer border border-border/80 shadow-[0_8px_18px_rgba(13,18,28,0.16)]">
                    <AvatarImage src={user?.image} />
                    <AvatarFallback>{user?.name?.[0] ?? "U"}</AvatarFallback>
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
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                className="border-border/80 bg-card/80 text-foreground/80 hover:bg-foreground/6 hover:text-foreground"
              >
                <Link to="/login">Sign in</Link>
              </Button>
              <Button
                asChild
                className="bg-brand text-brand-ink font-semibold shadow-[0_12px_30px_rgba(201,158,84,0.35)] hover:bg-brand-soft"
              >
                <Link to="/register">Sign up</Link>
              </Button>
            </div>
          )}
          <ModeToggle />

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-border/80 bg-card/80 text-foreground/80 hover:bg-foreground/6 hover:text-foreground md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="border-border/80 bg-background/95 text-foreground backdrop-blur-xl"
            >
              <SheetHeader className="pb-2">
                <SheetTitle className="text-foreground">Things</SheetTitle>
                <p className="text-xs uppercase tracking-[0.3em] text-foreground/50">
                  Navigation
                </p>
              </SheetHeader>
              <nav className="flex flex-col gap-2 px-4">
                {navItems.map((route) => {
                  const active = isActiveRoute(route.path);
                  return (
                    <SheetClose asChild key={route.path}>
                      <Link
                        to={route.path}
                        className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                          active
                            ? "border border-brand/40 bg-brand/18 text-brand-strong"
                            : "border border-border/70 bg-card/70 text-foreground/85 hover:bg-foreground/6 hover:text-foreground"
                        }`}
                      >
                        {route.label}
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>
              <div className="mt-6 space-y-3 px-4">
                {isAuthenticated ? (
                  <>
                    <SheetClose asChild>
                      <Link
                        to="/profile"
                        className="block rounded-xl border border-border/70 bg-card/70 px-4 py-3 text-sm text-foreground/85 transition hover:bg-foreground/6 hover:text-foreground"
                      >
                        Profile
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to="/settings"
                        className="block rounded-xl border border-border/70 bg-card/70 px-4 py-3 text-sm text-foreground/85 transition hover:bg-foreground/6 hover:text-foreground"
                      >
                        Settings
                      </Link>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full border-border/80 bg-card/80 text-foreground/80 hover:bg-foreground/6 hover:text-foreground"
                      >
                        <Link to="/login">Sign in</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        asChild
                        className="w-full bg-brand text-brand-ink font-semibold shadow-[0_12px_30px_rgba(201,158,84,0.35)] hover:bg-brand-soft"
                      >
                        <Link to="/register">Sign up</Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
