import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bell,
  BellRing,
  Eye,
  Calendar,
  Heart,
  Pencil,
  Share2,
} from "lucide-react";
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
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="skeleton aspect-video w-full rounded-3xl" />
          <div className="skeleton h-7 w-2/3 rounded-lg" />
          <div className="skeleton h-16 w-full rounded-2xl" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 animate-fade-up">
        <div className="relative">
          {video.thumbnail && (
            <img
              src={video.thumbnail}
              alt=""
              aria-hidden
              className="absolute inset-0 -z-10 h-full w-full scale-105 rounded-3xl object-cover opacity-40 blur-3xl"
            />
          )}
          <div className="aspect-video w-full overflow-hidden rounded-3xl bg-black shadow-2xl shadow-black/50 ring-1 ring-white/10">
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
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                Video unavailable
              </div>
            )}
          </div>
        </div>

        <h1 className="mt-5 text-xl font-bold leading-snug tracking-tight md:text-2xl">
          {video.title}
        </h1>
        {video.isPublished === false && (
          <span className="mt-2 inline-block rounded-lg bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-200">
            Draft — only you can see this video
          </span>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          {owner && (
            <div className="flex min-w-0 items-center gap-3">
              <Link
                to={`/channel/${owner.username}`}
                className="flex min-w-0 items-center gap-3"
              >
                <UserAvatar
                  src={owner.avatar}
                  name={owner.fullName}
                  className="h-11 w-11"
                  ring
                />
                <div className="min-w-0">
                  <div className="truncate font-semibold">{owner.fullName}</div>
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
                  size="sm"
                  className="ml-2 rounded-full px-4"
                >
                  {subscribed ? <BellRing /> : <Bell />}
                  {subscribed ? "Subscribed" : "Subscribe"}
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleLike}
              variant="secondary"
              size="sm"
              className={cn(
                "rounded-full",
                liked &&
                  "border-pink-400/40 bg-pink-500/15 text-pink-200 hover:bg-pink-500/25",
              )}
            >
              <Heart className={cn(liked && "fill-current")} />{" "}
              {formatCount(video.likes)}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full"
              onClick={share}
            >
              <Share2 /> Share
            </Button>
            <SaveToPlaylist videoId={video._id} />
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                asChild
              >
                <Link to={`/video/edit/${video._id}`}>
                  <Pencil /> Edit
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="glass mt-5 rounded-2xl p-4">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-fuchsia-300" />{" "}
              {formatViews(video.views)} views
            </span>
            <span
              className="flex items-center gap-1.5"
              title={formatDate(video.createdAt)}
            >
              <Calendar className="h-4 w-4 text-fuchsia-300" />{" "}
              {timeAgo(video.createdAt)}
            </span>
          </div>
          {video.description ? (
            <>
              <p
                className={cn(
                  "mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85",
                  !expanded && "line-clamp-3",
                )}
              >
                {video.description}
              </p>
              {video.description.length > 180 && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-2 text-sm font-semibold text-fuchsia-300 hover:underline"
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm italic text-muted-foreground">
              No description provided.
            </p>
          )}
        </div>

        <CommentSection videoId={video._id} />
      </div>

      <aside className="min-w-0">
        <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Up next
        </h2>
        <div className="space-y-2">
          {relatedLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
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
