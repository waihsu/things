import Navbar from "@/src/interface/themes/navbar";
import { Outlet } from "react-router";
import { ThemeProvider } from "../providers/theme-provider";
import { Toaster } from "sonner";
import { usePresenceRealtime } from "@/src/queries/presence/api/use-presence-realtime";
import { useContentRealtime } from "@/src/queries/live/api/use-content-realtime";

export default function RootLayout() {
  usePresenceRealtime();
  useContentRealtime();

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="things-web-app things-web-shell max-h-screen flex flex-col bg-background text-foreground">
        <Navbar />

        <main className="relative z-10 w-full h-svh py-6 md:py-8">
          <Outlet />
        </main>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
