import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { PlaylistAPI } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { VideoCard } from "../components/VideoCard";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage, isNotFoundError } from "../services/api";
import { toast } from "sonner";
import { getOwner } from "../lib/format";

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

  const owner = getOwner(data);
  const isMine = owner?._id === me?._id;

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
          <h1 className="text-2xl font-bold">{data.name}</h1>
          {data.description && <p className="text-muted-foreground mt-1">{data.description}</p>}
          {owner && (
            <Link to={`/channel/${owner.username}`} className="text-sm text-muted-foreground hover:underline">
              @{owner.username}
            </Link>
          )}
        </div>
        {isMine && (
          <Button variant="destructive" size="sm" onClick={remove}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete playlist
          </Button>
        )}
      </div>

      {!data.videos?.length ? (
        <EmptyState title="No videos in this playlist" />
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
          {data.videos.map((v) => (
            <div key={v._id} className="relative">
              <VideoCard video={v} />
              {isMine && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 left-2 h-8 w-8"
                  onClick={(e) => {
                    e.preventDefault();
                    removeVideo(v._id);
                  }}
                  aria-label="Remove from playlist"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}