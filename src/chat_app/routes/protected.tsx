import { useAuthStore } from "@/src/store/use-auth-store";
import { Navigate, Outlet, useLocation } from "react-router";

export default function Preotected() {
  const { isAuthenticated, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
          <div className="flex items-center gap-3 rounded-full border border-neutral-800 bg-neutral-900/60 px-4 py-2 text-sm text-neutral-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Checking session...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
