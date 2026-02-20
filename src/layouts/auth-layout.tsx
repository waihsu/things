import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "../store/use-auth-store";
import { Toaster } from "sonner";

type AuthRedirectState = {
  from?: {
    pathname?: string;
  };
};

export default function AuthLayout() {
  const { isAuthenticated, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(243,213,149,0.25),transparent_45%),radial-gradient(circle_at_82%_6%,rgba(109,213,181,0.18),transparent_40%),linear-gradient(180deg,#fbf7ef,#fefcf8)] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(244,208,131,0.2),transparent_45%),radial-gradient(circle_at_82%_6%,rgba(109,213,181,0.16),transparent_40%),linear-gradient(180deg,#0b0c12,#10131d_45%,#0b0d12)]" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(0deg,rgba(0,0,0,0.08)_1px,transparent_1px)] dark:[background-image:linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:100%_32px]" />
        </div>
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
          <div className="flex items-center gap-3 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
            Preparing auth...
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const state = location.state as AuthRedirectState | null;
    const redirectTo = state?.from?.pathname ?? "/";
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(243,213,149,0.25),transparent_45%),radial-gradient(circle_at_82%_6%,rgba(109,213,181,0.18),transparent_40%),linear-gradient(180deg,#fbf7ef,#fefcf8)] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(244,208,131,0.2),transparent_45%),radial-gradient(circle_at_82%_6%,rgba(109,213,181,0.16),transparent_40%),linear-gradient(180deg,#0b0c12,#10131d_45%,#0b0d12)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(0deg,rgba(0,0,0,0.08)_1px,transparent_1px)] dark:[background-image:linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:100%_32px]" />
      </div>
      <div className="relative overflow-hidden">
        <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-stretch gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-0">
          <section className="flex flex-col justify-center gap-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Things
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-foreground md:text-5xl">
                Welcome back.
                <span className="block text-muted-foreground">
                  Organize what matters and ship it faster.
                </span>
              </h1>
              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                Keep your notes, tasks, and ideas in one place. Sign in to pick
                up right where you left off.
              </p>
            </div>
            <div className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Focus
                </p>
                <p className="mt-2 text-sm text-foreground/80">
                  Distraction-free workspace built for daily momentum.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Sync
                </p>
                <p className="mt-2 text-sm text-foreground/80">
                  Your data stays current across every device.
                </p>
              </div>
            </div>
          </section>
          <section className="flex items-center justify-center lg:justify-end">
            {/* <div className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900/70 p-8 shadow-[0_25px_120px_-60px_rgba(16,185,129,0.6)]"> */}
            <Outlet />
            {/* </div> */}
          </section>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
