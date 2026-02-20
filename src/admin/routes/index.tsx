import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Home from "../pages/home";
import Preotected from "./protected";

import AuthLayout from "@/src/layouts/auth-layout";
import { SignInPage } from "../pages/sign-in";
import AdminRootLayout from "../layouts/admin-root-layout";
import AdminOnlyRoute from "./admin-only";
import StoresPage from "../pages/stories";
import SeriesPage from "../pages/series";
import StoryDetailPage from "../pages/story-detail";
import EditStoryPage from "../pages/edit-story";
import SeriesDetailPage from "../pages/series-detail";
import EditSeriesPage from "../pages/edit-series";
import EditEpisodePage from "../pages/edit-episode";
import EpisodeDetailPage from "../pages/episode-detail";
import SettingsPage from "../pages/settings";
import PoemsPage from "../pages/poems";
import PoemDetailPage from "../pages/poem-detail";
import EditPoemPage from "../pages/edit-poem";
import PublicChatPage from "../pages/public-chat";
import ModerationPage from "../pages/moderation";
import UsersPage from "../pages/users";
import PublicProfilePage from "../pages/profile-public";

const resolveBasename = () => {
  const fromEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_APP_BASENAME;
  if (fromEnv && fromEnv.startsWith("/")) {
    return fromEnv;
  }
  if (typeof window !== "undefined") {
    if (window.location.pathname.startsWith("/admin/") || window.location.pathname === "/admin") {
      return "/admin";
    }
  }
  return "/";
};

function RootRoute() {
  return (
    <BrowserRouter basename={resolveBasename()}>
      <Routes>
        <Route element={<Preotected />}>
          <Route element={<AdminOnlyRoute />}>
            <Route element={<AdminRootLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/stories" element={<StoresPage />} />
              <Route path="/stories/:id" element={<StoryDetailPage />} />
              <Route path="/stories/:id/edit" element={<EditStoryPage />} />
              <Route path="/poems" element={<PoemsPage />} />
              <Route path="/poems/:id" element={<PoemDetailPage />} />
              <Route path="/poems/:id/edit" element={<EditPoemPage />} />
              <Route path="/series" element={<SeriesPage />} />
              <Route path="/series/:id" element={<SeriesDetailPage />} />
              <Route path="/series/:id/edit" element={<EditSeriesPage />} />
              <Route
                path="/series/:seriesId/episodes/:episodeId"
                element={<EpisodeDetailPage />}
              />
              <Route
                path="/series/:id/episodes/:episodeId/edit"
                element={<EditEpisodePage />}
              />
              <Route path="/chat" element={<PublicChatPage />} />
              <Route path="/moderation" element={<ModerationPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/profile/:handle" element={<PublicProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<SignInPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default RootRoute;
