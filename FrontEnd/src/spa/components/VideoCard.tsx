import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
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
        "relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--color-card)]",
        className,
      )}
    >
      {video.thumbnail && (
        <img
          src={video.thumbnail}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      )}
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/[0.06]" />
      {video.duration ? (
        <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-white">
          {formatDuration(video.duration)}
        </span>
      ) : null}
      {video.isPublished === false && (
        <span className="eyebrow absolute left-2 top-2 rounded-md bg-black/75 px-1.5 py-1 text-[10px] text-amber-300">
          Draft
        </span>
      )}
      <span className="scrubber group-hover:scale-x-100" />
    </div>
  );
}

export function VideoCard({ video, index }: { video: Video; index?: number }) {
  const owner = getOwner(video);
  const user = useAuthStore((s) => s.user);
  const isOwner = Boolean(owner?._id && owner._id === user?._id);

  return (
    <article
      className="group flex animate-rise flex-col gap-3.5"
      style={{ animationDelay: `${Math.min(index ?? 0, 11) * 35}ms` }}
    >
      <Link
        to={`/watch/${video._id}`}
        aria-label={video.title}
        className="rounded-xl"
      >
        <VideoThumb video={video} />
      </Link>

      <div className="flex gap-3">
        {owner && (
          <Link to={`/channel/${owner.username}`} className="shrink-0">
            <UserAvatar
              src={owner.avatar}
              name={owner.fullName}
              className="h-8 w-8"
            />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <Link to={`/watch/${video._id}`}>
            <h3 className="line-clamp-2 text-[15px] font-medium leading-[1.35] text-foreground decoration-brand decoration-2 underline-offset-4 group-hover:underline">
              {video.title}
            </h3>
          </Link>
          {owner && (
            <Link
              to={`/channel/${owner.username}`}
              className="mt-1 block truncate text-[13px] text-muted-foreground hover:text-foreground"
            >
              {owner.fullName ?? owner.username}
            </Link>
          )}
          <p className="eyebrow mt-2 text-[10.5px]">
            {formatViews(video.views)} views{" "}
            <span className="mx-1 text-brand">/</span>{" "}
            {timeAgo(video.createdAt)}
          </p>
        </div>
        {isOwner && (
          <Link
            to={`/video/edit/${video._id}`}
            className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-white/[0.08] hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            aria-label="Edit video"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        )}
      </div>
    </article>
  );
}

export function VideoRow({
  video,
  actions,
}: {
  video: Video;
  actions?: React.ReactNode;
}) {
  const owner = getOwner(video);
  return (
    <div className="group flex gap-3 rounded-lg p-1 transition-colors hover:bg-white/[0.03]">
      <Link to={`/watch/${video._id}`} className="w-40 shrink-0 sm:w-[168px]">
        <VideoThumb video={video} className="rounded-lg" />
      </Link>
      <div className="min-w-0 flex-1 py-0.5">
        <Link to={`/watch/${video._id}`}>
          <h4 className="line-clamp-2 text-sm font-medium leading-snug">
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
        <p className="eyebrow mt-1.5 text-[10px]">
          {formatViews(video.views)} views{" "}
          <span className="mx-0.5 text-brand">/</span>{" "}
          {timeAgo(video.createdAt)}
        </p>
      </div>
      {actions}
    </div>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="skeleton aspect-video w-full rounded-xl" />
      <div className="flex gap-3">
        <div className="skeleton h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="skeleton h-3.5 w-11/12 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}

export function VideoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[1900px]:grid-cols-5">
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
