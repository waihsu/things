import { Navigate, Outlet, useLocation } from "react-router";
import { Button } from "@/src/admin/components/ui/button";
import { useAuthStore } from "@/src/store/use-auth-store";
import { useGetSettings } from "@/src/queries/settings/api/use-get-settings";

export default function AdminOnlyRoute() {
  const { isAuthenticated, loading, logout } = useAuthStore();
  const location = useLocation();
  const settingsQuery = useGetSettings({ enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking admin access...</p>
      </div>
    );
  }

  if (settingsQuery.isError || !settingsQuery.data?.isAdmin) {
    return (
      <div className="mx-auto mt-20 max-w-xl rounded-3xl border border-border/60 bg-card/80 p-8 text-center">
        <h1 className="text-xl font-semibold">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is only available to admin accounts.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              void logout();
            }}
          >
            Logout
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
