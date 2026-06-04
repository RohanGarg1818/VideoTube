import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { PlaylistAPI } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage, isNotFoundError } from "../services/api";
import { toast } from "sonner";
import { getOwner } from "../lib/format";
import { timeAgo } from "../lib/format";

export function PlaylistPage() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const me = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data, loading, error, errorMessage, refetch } = useAsync(
    () => (playlistId ? PlaylistAPI.get(playlistId) : Promise.resolve(null)),
    [playlistId],
  );

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  if (error) {
    if (isNotFoundError(error)) {
      return <ErrorState message="Playlist not found" onRetry={refetch} />;
    }
    return <ErrorState message={errorMessage || "Failed to load playlist"} onRetry={refetch} />;
  }

  if (!data || !playlistId) return null;

  const owner = data.owner;
  const isMine = data.owner?._id === me?._id;
  const remove = async () => {
    if (!confirm("Delete this playlist?")) return;
    try {
      await PlaylistAPI.remove(playlistId);
      toast.success("Playlist deleted");
      navigate("/playlists");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const removeVideo = async (videoId: string) => {
    try {
      await PlaylistAPI.removeVideo(playlistId, videoId);
      toast.success("Removed from playlist");
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {data.name}
            </h1>

            <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
              {data.videos?.length ?? 0} videos
            </span>
          </div>

          {data.description && (
            <p className="text-muted-foreground mt-1">
              {data.description}
            </p>
          )}

          {owner && (
            <Link
              to={`/channel/${owner.username}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              @{owner.username}
            </Link>
          )}
        </div>

        {isMine && (
          <Button variant="destructive" size="sm" onClick={remove}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete playlist
          </Button>
        )}
      </div>

      {!data.videos?.length ? (
        <EmptyState title="No videos in this playlist" />
      ) : (
        <div className="space-y-4 mt-6">
          {data.videos.map((v) => {
            const videoOwner = getOwner(v);

            return (
              <div
                key={v._id}
                className="flex gap-4 rounded-lg border border-border p-3"
              >
                <Link
                  to={`/watch/${v._id}`}
                  className="flex gap-4 flex-1 min-w-0"
                >
                  <div className="w-64 shrink-0 overflow-hidden rounded-lg">
                    {v.thumbnail ? (
                      <img
                        src={v.thumbnail}
                        alt={v.title}
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-video w-full bg-muted" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg line-clamp-2">
                      {v.title}
                    </h3>

                    {videoOwner && (
                      <div className="mt-3 flex items-center gap-3">
                        <img
                          src={videoOwner.avatar}
                          alt={videoOwner.fullName}
                          className="h-8 w-8 rounded-full object-cover"
                        />

                        <div>
                          <p className="text-sm font-medium">
                            {videoOwner.fullName}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            @{videoOwner.username}
                          </p>
                        </div>
                      </div>
                    )}

                    {v.description && (
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                        {v.description}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-muted-foreground">
                      Uploaded {timeAgo(v.createdAt)}
                    </p>
                  </div>
                </Link>

                {isMine && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="self-start"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      if (
                        confirm(`Remove "${v.title}" from this playlist?`)
                      ) {
                        removeVideo(v._id);
                      }
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}