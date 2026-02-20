import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import AuthLayout from "@/src/layouts/auth-layout";
import AboutPage from "../pages/about";
import ChatHomePage from "../pages/chat-home";
import ChatPeoplePage from "../pages/chat-people";
import ChatShellLayout from "../layouts/chat-shell-layout";
import DirectMessagesLayout from "../pages/direct-messages-layout";
import DirectThreadPage from "../pages/direct-thread";
import { ProfilePage } from "../pages/profile";
import PublicChatPage from "../pages/public-chat";
import PublicProfilePage from "../pages/profile-public";
import Preotected from "./protected";
import SettingsPage from "../pages/settings";
import { SignInPage } from "../pages/sign-in";
import { SignUpPage } from "../pages/sign-up";

const resolveBasename = () => {
  const fromEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_APP_BASENAME;
  if (fromEnv && fromEnv.startsWith("/")) {
    return fromEnv;
  }
  if (typeof window !== "undefined") {
    if (window.location.pathname.startsWith("/chat_app/") || window.location.pathname === "/chat_app") {
      return "/chat_app";
    }
  }
  return "/";
};

function RootRoute() {
  return (
    <BrowserRouter basename={resolveBasename()}>
      <Routes>
        <Route element={<Preotected />}>
          <Route element={<ChatShellLayout />}>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<ChatHomePage />} />
            <Route path="/chat/public" element={<PublicChatPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/profile/:handle" element={<PublicProfilePage />} />
            <Route path="/chat/dm" element={<DirectMessagesLayout />}>
              <Route path=":userId" element={<DirectThreadPage />} />
            </Route>
            <Route path="/chat/people" element={<ChatPeoplePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
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
