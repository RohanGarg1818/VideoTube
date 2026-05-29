import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ThumbsUp, UserPlus, UserCheck, PlusCircle } from "lucide-react";
import { LikeAPI, PlaylistAPI, SubAPI, VideoAPI, type Playlist, type Video } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { ErrorState } from "../components/EmptyState";
import { CommentSection } from "../components/CommentSection";
import { VideoCard } from "../components/VideoCard";
import { formatViews, getOwner, timeAgo } from "../lib/format";
import { apiErrorMessage } from "../services/api";
import { toast } from "sonner";
import { useAuthStore } from "../store/authStore";

export function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: video, loading, error, refetch, setData } = useAsync<Video | null>(
    () => (videoId ? VideoAPI.get(videoId) : Promise.resolve(null)),
    [videoId],
  );
  const [liked, setLiked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [savingPlaylist, setSavingPlaylist] = useState(false);
  const owner = video ? getOwner(video) : undefined;
  const channelId = typeof video?.owner === "string" ? video.owner : owner?._id ?? "";

  const {
    data: playlists,
    loading: playlistsLoading,
    error: playlistsError,
    refetch: refetchPlaylists,
  } = useAsync<Playlist[]>(
    () => (user ? PlaylistAPI.byUser(user._id) : Promise.resolve([])),
    [user?._id],
  );
  const { data: recentVideoPayload, loading: loadingRecentVideos } = useAsync(
    () => VideoAPI.list({ sortBy: "createdAt", sortType: "desc", limit: 10 }),
    [videoId],
  );

  // Track view only for logged-in users
  useEffect(() => {
    if (!videoId || loading || !user) return;

    const timer = setTimeout(() => {
      VideoAPI.view(videoId)
        .then((updatedVideo) => {
          if (updatedVideo) {
            setData(updatedVideo as Video | null);
          }
        })
        .catch((err) => {
          console.error("Failed to track view:", err);
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [videoId, loading, user, setData]);

  useEffect(() => {
    if (!videoId || !user) return;

    setLoadingLike(true);
    LikeAPI.isVideoLiked(videoId)
      .then((result) => {
        setLiked(result.isLiked ?? false);
      })
      .catch(() => {})
      .finally(() => setLoadingLike(false));
  }, [videoId, user]);

  useEffect(() => {
    if (!user || !channelId) {
      setSubscribed(false);
      return;
    }

    SubAPI.subscribedTo(user._id)
      .then((channels) => {
        const isSubscribed = channels.some((entry) => entry.channel?._id === channelId);
        setSubscribed(isSubscribed);
      })
      .catch(() => {
        setSubscribed(false);
      });
  }, [user, channelId]);

  const selectedPlaylist = playlists?.find((p) => p._id === selectedPlaylistId);
  const alreadyInSelectedPlaylist = Boolean(
    selectedPlaylist?.videos?.some((v) => (typeof v === "string" ? v : v._id) === video?._id),
  );

  const addToPlaylist = async () => {
    if (!user) return toast.error("Sign in to add videos to playlist");
    if (!selectedPlaylistId) return toast.error("Select a playlist");
    if (!video) return;

    if (alreadyInSelectedPlaylist) {
      toast.success("Video already in selected playlist");
      return;
    }

    setSavingPlaylist(true);
    try {
      await PlaylistAPI.addVideo(selectedPlaylistId, video._id);
      toast.success("Video added to playlist");
      setPlaylistDialogOpen(false);
      setSelectedPlaylistId("");
      refetchPlaylists();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSavingPlaylist(false);
    }
  };

  if (loading)
    return (
      <div className="space-y-4">
        <div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    );
  if (error) return <ErrorState message={error?.message || "Something went wrong"} onRetry={refetch} />;
  if (!video) return null;

  const recentVideos = (Array.isArray(recentVideoPayload)
    ? recentVideoPayload
    : recentVideoPayload && typeof recentVideoPayload === "object" && "docs" in recentVideoPayload
      ? recentVideoPayload.docs
      : []
  )
    .filter((v) => v._id !== video._id)
    .slice(0, 3);

  const handleLike = async () => {
    if (!user) return toast.error("Sign in to like");
    try {
      const result = await LikeAPI.toggleVideo(video._id);
      setLiked(result.isVideoLiked);
      setData((prev) => (prev ? { ...prev, likes: result.likes } : prev));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const handleSub = async () => {
    if (!user) return toast.error("Sign in to subscribe");
    if (!channelId) return;
    try {
      const result = await SubAPI.toggle(channelId);
      setSubscribed(Boolean(result?.data?.isSubscribed ?? result?.isSubscribed));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        {video.videoFile ? (
          <video src={video.videoFile} controls poster={video.thumbnail} className="h-full w-full" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            Video unavailable
          </div>
        )}
      </div>

      <h1 className="text-xl font-semibold mt-4">{video.title}</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {formatViews(video.views)} views · {Math.max(0, video.likes ?? 0)} likes · {timeAgo(video.createdAt)}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 border-b border-border pb-4">
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleSub}
            variant={subscribed ? "secondary" : "default"}
            size="sm"
            className={subscribed ? "bg-zinc-700 text-white hover:bg-zinc-700/90 dark:bg-zinc-200 dark:text-zinc-900" : ""}
          >
            {subscribed ? <UserCheck className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
            {subscribed ? "Subscribed" : "Subscribe"}
          </Button>
          {owner && (
            <Link to={`/channel/${owner.username}`} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={owner.avatar} />
                <AvatarFallback>{owner.fullName?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{owner.fullName}</div>
                <div className="text-xs text-muted-foreground">@{owner.username}</div>
              </div>
            </Link>
          )}
        </div>
        <Button onClick={handleLike} variant={liked ? "default" : "secondary"} size="sm" disabled={loadingLike}>
          <ThumbsUp className="h-4 w-4 mr-2" fill={liked ? "currentColor" : "none"} />
          {liked ? "Liked" : "Like"}
        </Button>
      </div>

      {video.description && (
        <div className="mt-4 rounded-lg bg-muted/50 p-4 text-sm whitespace-pre-wrap">
          {video.description}
        </div>
      )}

      {user && (
        <div className="mt-4">
          <Dialog open={playlistDialogOpen} onOpenChange={setPlaylistDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="mr-2">
                <PlusCircle className="h-4 w-4 mr-2" /> Add to playlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add video to playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {playlistsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading playlists…</p>
                ) : playlistsError ? (
                  <p className="text-sm text-destructive">Unable to load playlists</p>
                ) : playlists?.length ? (
                  <label className="space-y-2 text-sm">
                    <span className="font-medium">Choose playlist</span>
                    <select
                      value={selectedPlaylistId}
                      onChange={(e) => setSelectedPlaylistId(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select a playlist</option>
                      {playlists.map((playlist) => (
                        <option key={playlist._id} value={playlist._id}>
                          {playlist.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <p className="text-sm text-muted-foreground">No playlists found. Create one first.</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  disabled={
                    savingPlaylist || !selectedPlaylistId || !playlists?.length
                  }
                  onClick={addToPlaylist}
                >
                  {savingPlaylist ? "Adding…" : "Add to playlist"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="mt-6 border-t border-border pt-6">
        <h2 className="text-lg font-semibold mb-4">More videos</h2>
        {loadingRecentVideos ? (
          <p className="text-sm text-muted-foreground">Loading suggestions...</p>
        ) : recentVideos.length ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {recentVideos.map((recentVideo) => (
              <VideoCard key={recentVideo._id} video={recentVideo} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent videos to suggest right now.</p>
        )}
      </div>

      {channelId && <CommentSection videoId={video._id} channelId={channelId} />}
    </div>
  );
}