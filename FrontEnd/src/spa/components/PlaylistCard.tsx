import { Link } from "react-router-dom";
import { ListVideo } from "lucide-react";
import type { Playlist } from "../services/endpoints";
import { timeAgo } from "../lib/format";

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const cover = playlist.videos?.find((v) => v.thumbnail)?.thumbnail;
  const count = playlist.totalVideos ?? playlist.videos?.length ?? 0;
  return (
    <Link to={`/playlist/${playlist._id}`} className="group block">
      <div className="relative pt-1.5">
        <div className="absolute inset-x-3 top-0 h-3 rounded-t-lg bg-zinc-700/60" />
        <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-800">
          {cover && (
            <img
              src={cover}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          )}
          <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded bg-black/80 px-1.5 py-px text-[11px] font-medium text-white">
            <ListVideo className="h-3 w-3" /> {count}{" "}
            {count === 1 ? "video" : "videos"}
          </span>
        </div>
      </div>
      <h3 className="mt-3 truncate text-[15px] font-medium">{playlist.name}</h3>
      <p className="truncate text-[13px] text-muted-foreground">
        {playlist.description || "Playlist"}
        {playlist.updatedAt && ` · Updated ${timeAgo(playlist.updatedAt)}`}
      </p>
    </Link>
  );
}
