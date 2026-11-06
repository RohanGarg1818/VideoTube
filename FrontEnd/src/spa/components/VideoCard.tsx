import { Link } from "react-router-dom";
import { Pencil, Play } from "lucide-react";
import { formatDuration, formatViews, getOwner, timeAgo } from "../lib/format";
import type { Video } from "../services/endpoints";
import { useAuthStore } from "../store/authStore";
import { UserAvatar } from "./UserAvatar";
import { cn } from "@/lib/utils";

export function VideoThumb({
  video,
  className,
}: {
  video: Video;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10",
        className,
      )}
    >
      {video.thumbnail ? (
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-violet-900/50 to-fuchsia-900/40" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="absolute inset-0 grid place-items-center opacity-0 transition-all duration-300 group-hover:opacity-100">
        <span className="grid h-12 w-12 scale-75 place-items-center rounded-full border border-white/30 bg-white/15 backdrop-blur-md transition-transform duration-300 group-hover:scale-100">
          <Play className="h-5 w-5 translate-x-[1px] fill-white text-white" />
        </span>
      </div>
      {video.duration ? (
        <span className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
          {formatDuration(video.duration)}
        </span>
      ) : null}
      {video.isPublished === false && (
        <span className="absolute left-2 top-2 rounded-lg bg-amber-500/80 px-2 py-0.5 text-[11px] font-semibold text-black">
          Draft
        </span>
      )}
    </div>
  );
}

export function VideoCard({
  video,
  index = 0,
}: {
  video: Video;
  index?: number;
}) {
  const owner = getOwner(video);
  const user = useAuthStore((s) => s.user);
  const isOwner = Boolean(owner?._id && owner._id === user?._id);

  return (
    <article
      className="group relative flex animate-fade-up flex-col gap-3 rounded-3xl p-2 transition-colors duration-300 hover:bg-white/[0.04]"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <Link to={`/watch/${video._id}`} aria-label={video.title}>
        <VideoThumb video={video} />
      </Link>

      <div className="flex gap-3 px-1">
        {owner && (
          <Link to={`/channel/${owner.username}`} className="shrink-0">
            <UserAvatar src={owner.avatar} name={owner.fullName} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <Link to={`/watch/${video._id}`}>
            <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-fuchsia-100">
              {video.title}
            </h3>
          </Link>
          {owner && (
            <Link
              to={`/channel/${owner.username}`}
              className="mt-1 block truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {owner.fullName ?? owner.username}
            </Link>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground/80">
            {formatViews(video.views)} views · {timeAgo(video.createdAt)}
          </p>
        </div>
        {isOwner && (
          <Link
            to={`/video/edit/${video._id}`}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground opacity-0 transition hover:bg-white/10 hover:text-foreground group-hover:opacity-100"
            aria-label="Edit video"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        )}
      </div>
    </article>
  );
}

/** Horizontal compact card – used in "Up next", playlists and history. */
export function VideoRow({
  video,
  actions,
}: {
  video: Video;
  actions?: React.ReactNode;
}) {
  const owner = getOwner(video);
  return (
    <div className="group flex gap-3 rounded-2xl p-1.5 transition-colors hover:bg-white/[0.05]">
      <Link to={`/watch/${video._id}`} className="w-40 shrink-0 sm:w-44">
        <VideoThumb video={video} className="rounded-xl" />
      </Link>
      <div className="min-w-0 flex-1 py-0.5">
        <Link to={`/watch/${video._id}`}>
          <h4 className="line-clamp-2 text-sm font-semibold leading-snug">
            {video.title}
          </h4>
        </Link>
        {owner && (
          <Link
            to={`/channel/${owner.username}`}
            className="mt-1 block truncate text-xs text-muted-foreground hover:text-foreground"
          >
            {owner.fullName}
          </Link>
        )}
        <p className="text-xs text-muted-foreground/80">
          {formatViews(video.views)} views · {timeAgo(video.createdAt)}
        </p>
      </div>
      {actions}
    </div>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-2">
      <div className="skeleton aspect-video w-full rounded-2xl" />
      <div className="flex gap-3 px-1">
        <div className="skeleton h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-11/12 rounded-md" />
          <div className="skeleton h-3 w-1/2 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function VideoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {children}
    </div>
  );
}

export function VideoGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <VideoGrid>
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </VideoGrid>
  );
}
