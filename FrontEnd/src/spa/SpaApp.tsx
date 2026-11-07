import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AppLayout } from "./layout/AppLayout";
import { AuthLayout } from "./layout/AuthLayout";
import { RequireAuth } from "./layout/RequireAuth";
import { Logo } from "./components/Logo";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { VideoPage } from "./pages/VideoPage";
import { UploadPage } from "./pages/UploadPage";
import { EditVideoPage } from "./pages/EditVideoPage";
import { ChannelPage } from "./pages/ChannelPage";
import { PlaylistPage } from "./pages/PlaylistPage";
import { LikedVideosPage } from "./pages/LikedVideosPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { CommunityPage } from "./pages/CommunityPage";
import { ProfileSettingsPage } from "./pages/ProfileSettingsPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { MyPlaylistsPage } from "./pages/MyPlaylistsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { useAuthStore } from "./store/authStore";

// Recharts is heavy – only load the studio bundle when a creator opens it
const StudioPage = lazy(() =>
  import("./pages/StudioPage").then((m) => ({ default: m.StudioPage })),
);

function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <Logo className="opacity-80" />
    </div>
  );
}

function Bootstrap({ children }: { children: React.ReactNode }) {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const ready = useAuthStore((s) => s.ready);
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);
  return ready ? <>{children}</> : <Splash />;
}

export function SpaApp() {
  return (
    <BrowserRouter>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          className: "!rounded-lg !border-white/10 !bg-[#1c1c1f] !text-[13px]",
        }}
      />
      <Bootstrap>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/explore"
              element={<HomePage key="explore" defaultSort="views" />}
            />
            <Route path="/watch/:videoId" element={<VideoPage />} />
            <Route path="/channel/:username" element={<ChannelPage />} />
            <Route path="/playlist/:playlistId" element={<PlaylistPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/upload" element={<UploadPage />} />
              <Route
                path="/studio"
                element={
                  <Suspense
                    fallback={<div className="skeleton h-96 rounded-xl" />}
                  >
                    <StudioPage />
                  </Suspense>
                }
              />
              <Route path="/liked" element={<LikedVideosPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/playlists" element={<MyPlaylistsPage />} />
              <Route path="/settings" element={<ProfileSettingsPage />} />
              <Route
                path="/settings/password"
                element={<ChangePasswordPage />}
              />
              <Route path="/video/edit/:videoId" element={<EditVideoPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Bootstrap>
    </BrowserRouter>
  );
}
