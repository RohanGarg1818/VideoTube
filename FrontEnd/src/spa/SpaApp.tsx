import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AppLayout } from "./layout/AppLayout";
import { AuthLayout } from "./layout/AuthLayout";
import { RequireAuth } from "./layout/RequireAuth";
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
import { useAuthStore } from "./store/authStore";

function Bootstrap({ children }: { children: React.ReactNode }) {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const ready = useAuthStore((s) => s.ready);
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  return <>{children}</>;
}

export function SpaApp() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster theme="dark" position="bottom-right" richColors />
      <Bootstrap>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/watch/:videoId" element={<VideoPage />} />
            <Route path="/channel/:username" element={<ChannelPage />} />
            <Route path="/playlist/:playlistId" element={<PlaylistPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/edit/:videoId" element={<EditVideoPage />} />
              <Route path="/liked" element={<LikedVideosPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/playlists" element={<MyPlaylistsPage />} />
              <Route path="/settings" element={<ProfileSettingsPage />} />
              <Route path="/video/edit/:videoId" element={<EditVideoPage />} />
              <Route path="/settings/password" element={<ChangePasswordPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Bootstrap>
    </BrowserRouter>
  );
}