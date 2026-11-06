import { Link } from "react-router-dom";
import { ListVideo, Play } from "lucide-react";
import type { Playlist } from "../services/endpoints";
import { timeAgo } from "../lib/format";

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const cover = playlist.videos?.find((v) => v.thumbnail)?.thumbnail;
  const count = playlist.totalVideos ?? playlist.videos?.length ?? 0;
  return (
    <Link
      to={`/playlist/${playlist._id}`}
      className="group block animate-fade-up"
    >
      <div className="relative">
        {/* stacked "deck" effect */}
        <div className="absolute inset-x-4 -top-2 h-full rounded-2xl bg-white/5 ring-1 ring-white/10" />
        <div className="absolute inset-x-2 -top-1 h-full rounded-2xl bg-white/[0.08] ring-1 ring-white/10" />
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-violet-800/50 to-fuchsia-800/40 ring-1 ring-white/10">
          {cover && (
            <img
              src={cover}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-y-0 right-0 flex w-2/5 flex-col items-center justify-center gap-1 bg-black/55 backdrop-blur-md">
            <ListVideo className="h-5 w-5" />
            <span className="text-sm font-semibold">{count}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              videos
            </span>
          </div>
          <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-md">
              <Play className="h-4 w-4 fill-current" /> View playlist
            </span>
          </div>
        </div>
      </div>
      <h3 className="mt-3 truncate font-semibold">{playlist.name}</h3>
      <p className="line-clamp-1 text-sm text-muted-foreground">
        {playlist.description || "No description"}
      </p>
      {playlist.updatedAt && (
        <p className="text-xs text-muted-foreground/70">
          Updated {timeAgo(playlist.updatedAt)}
        </p>
      )}
    </Link>
  );
}
