import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDuration, formatViews, getOwner, timeAgo } from "../lib/format";
import type { Video } from "../services/endpoints";

export function VideoCard({ video }: { video: Video }) {
  const owner = getOwner(video);
  return (
    <Link to={`/watch/${video._id}`} className="group flex flex-col gap-3">
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
      <div className="flex gap-3">
        {owner && (
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={owner.avatar} alt={owner.fullName} />
            <AvatarFallback>
              {owner.fullName?.slice(0, 1).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {video.title}
          </h3>
          {owner && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {owner.fullName ?? owner.username}
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatViews(video.views)} views · {Math.max(0, video.likes ?? 0)} likes · {timeAgo(video.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />
      <div className="flex gap-3">
        <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}