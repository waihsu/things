import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Home from "../pages/home";
import Preotected from "./protected";

import AuthLayout from "@/src/layouts/auth-layout";
import { ProfilePage } from "../pages/profile";
import { SignInPage } from "../pages/sign-in";
import { SignUpPage } from "../pages/sign-up";
import RootLayout from "@/src/layouts/root-layout";
import CreateStoryPage from "../pages/create-story";
import CreateSeriesPage from "../pages/create-series";
import StoresPage from "../pages/stories";
import SeriesPage from "../pages/series";
import StoryDetailPage from "../pages/story-detail";
import EditStoryPage from "../pages/edit-story";
import SeriesDetailPage from "../pages/series-detail";
import EditSeriesPage from "../pages/edit-series";
import CreateEpisodePage from "../pages/create-episode";
import EditEpisodePage from "../pages/edit-episode";
import AboutPage from "../pages/about";
import PublicProfilePage from "../pages/profile-public";
import SettingsLayout from "../pages/settings/settings-layout";
import SettingsAccountPage from "../pages/settings/settings-account";
import SettingsExperiencePage from "../pages/settings/settings-experience";
import SettingsNotificationsPage from "../pages/settings/settings-notifications";
import SettingsSecurityPage from "../pages/settings/settings-security";
import SettingsPrivacyPage from "../pages/settings/settings-privacy";
import SettingsAdminPage from "../pages/settings/settings-admin";
import PoemsPage from "../pages/poems";
import PoemDetailPage from "../pages/poem-detail";
import CreatePoemPage from "../pages/create-poem";
import EditPoemPage from "../pages/edit-poem";
import PublicChatPage from "../pages/public-chat";

function RootRoute() {
  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/profile/:handle" element={<PublicProfilePage />} />
          <Route path="/" element={<Home />} />
          <Route path="/stories" element={<StoresPage />} />
          <Route path="/stories/:id" element={<StoryDetailPage />} />
          <Route path="/poems" element={<PoemsPage />} />
          <Route path="/poems/:id" element={<PoemDetailPage />} />
          <Route path="/series" element={<SeriesPage />} />
          <Route path="/series/:id" element={<SeriesDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route element={<Preotected />}>
            <Route path="/chat" element={<PublicChatPage />} />
            <Route path="/stories/:id/edit" element={<EditStoryPage />} />
            <Route path="/poems/:id/edit" element={<EditPoemPage />} />

            <Route path="/series/:id/edit" element={<EditSeriesPage />} />

            <Route
              path="/series/:id/episodes/new"
              element={<CreateEpisodePage />}
            />
            <Route
              path="/series/:id/episodes/:episodeId/edit"
              element={<EditEpisodePage />}
            />
            <Route
              path="/series/:seriesId/episodes/:episodeId"
              element={React.createElement(
                require("../pages/episode-detail").default,
              )}
            />

            <Route path="/create-story" element={<CreateStoryPage />} />
            <Route path="/create-poem" element={<CreatePoemPage />} />
            <Route path="/create-serie" element={<CreateSeriesPage />} />
            <Route path="/create-series" element={<CreateSeriesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="account" replace />} />
              <Route path="account" element={<SettingsAccountPage />} />
              <Route path="experience" element={<SettingsExperiencePage />} />
              <Route
                path="notifications"
                element={<SettingsNotificationsPage />}
              />
              <Route path="security" element={<SettingsSecurityPage />} />
              <Route path="privacy" element={<SettingsPrivacyPage />} />
              <Route path="admin" element={<SettingsAdminPage />} />
            </Route>
          </Route>
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default RootRoute;
