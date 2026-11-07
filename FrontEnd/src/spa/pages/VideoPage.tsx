import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, Pencil, Share2, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LikeAPI, SubAPI, VideoAPI, type Video } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { ErrorState } from "../components/EmptyState";
import { CommentSection } from "../components/CommentSection";
import { VideoRow } from "../components/VideoCard";
import { UserAvatar } from "../components/UserAvatar";
import { SaveToPlaylist } from "../components/SaveToPlaylist";
import {
  formatCount,
  formatDate,
  formatViews,
  getOwner,
  plural,
  timeAgo,
} from "../lib/format";
import { apiErrorMessage, isNotFoundError } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type DetailedOwner = {
  _id?: string;
  username?: string;
  fullName?: string;
  avatar?: string;
  subscribersCount?: number;
  isSubscribed?: boolean;
};

export function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const user = useAuthStore((s) => s.user);
  const {
    data: video,
    loading,
    error,
    errorMessage,
    refetch,
    setData,
  } = useAsync<Video | null>(
    () => (videoId ? VideoAPI.get(videoId) : Promise.resolve(null)),
    [videoId, user?._id],
  );
  const { data: related, loading: relatedLoading } = useAsync(
    () => (videoId ? VideoAPI.related(videoId, 10) : Promise.resolve([])),
    [videoId],
  );
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  // Register a view (unique per user server-side) once the page settles
  useEffect(() => {
    if (!videoId || !user) return;
    const t = setTimeout(() => {
      VideoAPI.view(videoId)
        .then(
          (v) =>
            v && setData((prev) => (prev ? { ...prev, views: v.views } : prev)),
        )
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [videoId, user, setData]);

  useEffect(() => setExpanded(false), [videoId]);

  if (loading && !video) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-4">
          <div className="skeleton aspect-video w-full rounded-xl" />
          <div className="skeleton h-7 w-2/3 rounded-lg" />
          <div className="skeleton h-16 w-full rounded-xl" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <ErrorState
        message={
          isNotFoundError(error)
            ? "This video doesn't exist or is private."
            : (errorMessage ?? "")
        }
        onRetry={refetch}
      />
    );
  }
  if (!video) return null;

  const owner = getOwner(video) as DetailedOwner | null;
  const isOwner = Boolean(owner?._id && owner._id === user?._id);
  const liked = Boolean(video.isLiked);
  const subscribed = Boolean(owner?.isSubscribed);

  const handleLike = async () => {
    if (!user) return toast.error("Sign in to like videos");
    const prev = video;
    setData({
      ...video,
      isLiked: !liked,
      likes: Math.max(0, (video.likes ?? 0) + (liked ? -1 : 1)),
    });
    try {
      const res = await LikeAPI.toggleVideo(video._id);
      setData((v) =>
        v ? { ...v, isLiked: res.isVideoLiked, likes: res.likes } : v,
      );
    } catch (e) {
      setData(prev);
      toast.error(apiErrorMessage(e));
    }
  };

  const handleSub = async () => {
    if (!user) return toast.error("Sign in to subscribe");
    if (!owner?._id) return;
    setBusy(true);
    try {
      const res = await SubAPI.toggle(owner._id);
      setData((v) =>
        v && typeof v.owner === "object"
          ? {
              ...v,
              owner: {
                ...v.owner,
                isSubscribed: res.isSubscribed,
                subscribersCount: res.subscribersCount,
              },
            }
          : v,
      );
      toast.success(
        res.isSubscribed ? `Subscribed to ${owner.fullName}` : "Unsubscribed",
      );
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: video.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <div className="grid gap-x-6 gap-y-8 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0">
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          {video.videoFile ? (
            <video
              key={video._id}
              src={video.videoFile}
              controls
              autoPlay
              playsInline
              poster={video.thumbnail}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Video unavailable
            </div>
          )}
        </div>

        <h1 className="mt-4 text-xl font-semibold leading-snug tracking-[-0.01em]">
          {video.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {owner && (
            <div className="flex min-w-0 items-center gap-3">
              <Link
                to={`/channel/${owner.username}`}
                className="flex min-w-0 items-center gap-3"
              >
                <UserAvatar
                  src={owner.avatar}
                  name={owner.fullName}
                  className="h-10 w-10"
                />
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-medium leading-tight">
                    {owner.fullName}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {plural(owner.subscribersCount, "subscriber")}
                  </div>
                </div>
              </Link>
              {!isOwner && (
                <Button
                  onClick={handleSub}
                  disabled={busy}
                  variant={subscribed ? "secondary" : "default"}
                  className="ml-3 rounded-full px-4"
                >
                  {subscribed && <Check />}
                  {subscribed ? "Subscribed" : "Subscribe"}
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleLike}
              variant="secondary"
              className="rounded-full"
              aria-pressed={liked}
            >
              <ThumbsUp className={cn(liked && "fill-current")} />{" "}
              {formatCount(video.likes)}
            </Button>
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={share}
            >
              <Share2 /> Share
            </Button>
            <SaveToPlaylist videoId={video._id} />
            {isOwner && (
              <Button variant="secondary" className="rounded-full" asChild>
                <Link to={`/video/edit/${video._id}`}>
                  <Pencil /> Edit
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-white/[0.05] p-3.5 text-sm">
          <p className="font-medium">
            {formatViews(video.views)} views{" "}
            <span className="ml-2" title={formatDate(video.createdAt)}>
              {timeAgo(video.createdAt)}
            </span>
            {video.isPublished === false && (
              <span className="ml-2 text-amber-400">
                · Draft (only visible to you)
              </span>
            )}
          </p>
          {video.description ? (
            <>
              <p
                className={cn(
                  "mt-2 whitespace-pre-wrap leading-relaxed text-foreground/90",
                  !expanded && "line-clamp-3",
                )}
              >
                {video.description}
              </p>
              {video.description.length > 180 && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-1 font-medium hover:underline"
                >
                  {expanded ? "Show less" : "…more"}
                </button>
              )}
            </>
          ) : (
            <p className="mt-2 text-muted-foreground">No description.</p>
          )}
        </div>

        <CommentSection videoId={video._id} />
      </div>

      <aside className="min-w-0">
        <div className="space-y-2">
          {relatedLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-1">
                <div className="skeleton aspect-video w-[168px] rounded-lg" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="skeleton h-3.5 w-full rounded" />
                  <div className="skeleton h-3 w-2/3 rounded" />
                </div>
              </div>
            ))
          ) : related?.length ? (
            related.map((v) => <VideoRow key={v._id} video={v} />)
          ) : (
            <p className="px-1 text-sm text-muted-foreground">
              No other videos yet.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
