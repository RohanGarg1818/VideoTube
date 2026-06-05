import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDuration, formatViews, getOwner, timeAgo } from "../lib/format";
import type { Video } from "../services/endpoints";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../store/authStore";

export function VideoCard({ video }: { video: Video }) {
  const owner = getOwner(video);
  const user = useAuthStore((s) => s.user);

  const isOwner = owner?._id === user?._id;

  return (
    <Link
      to={`/watch/${video._id}`}
      className="group flex flex-col gap-3"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-muted to-card" />
        )}

        {video.duration ? (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(video.duration)}
          </span>
        ) : null}
      </div>

      <div className="space-y-2">
        {owner && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage
                  src={owner.avatar}
                  alt={owner.fullName}
                />
                <AvatarFallback>
                  {owner.fullName?.slice(0, 1).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>

              <p className="truncate text-sm font-medium text-muted-foreground">
                {owner.fullName ?? owner.username}
              </p>
            </div>

            {isOwner && (
              <Link
                to={`/video/edit/${video._id}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  size="sm"
                  variant="outline"
                >
                  Edit
                </Button>
              </Link>
            )}
          </div>
        )}

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {video.title}
        </h3>

        <p className="text-xs text-muted-foreground">
          {formatViews(video.views)} views ·{" "}
          {Math.max(0, video.likes ?? 0)} likes ·{" "}
          {timeAgo(video.createdAt)}
        </p>
      </div>
    </Link>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        </div>

        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}