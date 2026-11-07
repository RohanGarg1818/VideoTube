import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Clock, Eye, ListVideo, Pencil, Play, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlaylistAPI, type Playlist } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { VideoRow } from "../components/VideoCard";
import { UserAvatar } from "../components/UserAvatar";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage, isNotFoundError } from "../services/api";
import {
  formatCount,
  formatLongDuration,
  plural,
  timeAgo,
} from "../lib/format";
import { toast } from "sonner";

export function PlaylistPage() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const me = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data, loading, error, errorMessage, refetch, setData } =
    useAsync<Playlist | null>(
      () => (playlistId ? PlaylistAPI.get(playlistId) : Promise.resolve(null)),
      [playlistId],
    );

  if (loading) return <div className="skeleton h-80 rounded-xl" />;
  if (error)
    return (
      <ErrorState
        message={
          isNotFoundError(error) ? "Playlist not found" : (errorMessage ?? "")
        }
        onRetry={refetch}
      />
    );
  if (!data || !playlistId) return null;

  const owner = typeof data.owner === "object" ? data.owner : undefined;
  const isMine = Boolean(owner?._id && owner._id === me?._id);
  const videos = data.videos ?? [];
  const cover = videos.find((v) => v.thumbnail)?.thumbnail;

  const removeVideo = async (videoId: string) => {
    setData({ ...data, videos: videos.filter((v) => v._id !== videoId) });
    try {
      await PlaylistAPI.removeVideo(playlistId, videoId);
      toast.success("Removed from playlist");
    } catch (e) {
      toast.error(apiErrorMessage(e));
      refetch();
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="surface relative overflow-hidden rounded-xl p-5">
          <div className="aspect-video overflow-hidden rounded-xl bg-zinc-800 ">
            {cover ? (
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <ListVideo className="m-auto h-full w-10 text-white/40" />
            )}
          </div>
          <h1 className="display mt-6 text-[40px]">{data.name}</h1>
          {owner && (
            <Link
              to={`/channel/${owner.username}`}
              className="mt-3 flex items-center gap-2 text-sm hover:underline"
            >
              <UserAvatar
                src={owner.avatar}
                name={owner.fullName}
                className="h-7 w-7"
              />{" "}
              {owner.fullName}
            </Link>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ListVideo className="h-3.5 w-3.5" />{" "}
              {plural(videos.length, "video")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />{" "}
              {formatLongDuration(data.totalDuration)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />{" "}
              {formatCount(data.totalViews ?? 0)} views
            </span>
          </div>
          {data.description && (
            <p className="mt-4 whitespace-pre-wrap text-sm text-foreground/80">
              {data.description}
            </p>
          )}
          {data.updatedAt && (
            <p className="mt-2 text-xs text-muted-foreground/70">
              Updated {timeAgo(data.updatedAt)}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {videos[0] && (
              <Button className="flex-1" asChild>
                <Link to={`/watch/${videos[0]._id}`}>
                  <Play className="fill-current" /> Play all
                </Link>
              </Button>
            )}
            {isMine && (
              <>
                <EditPlaylistDialog
                  playlist={data}
                  onSaved={(p) =>
                    setData({
                      ...data,
                      name: p.name,
                      description: p.description,
                    })
                  }
                />
                <ConfirmDialog
                  title="Delete playlist?"
                  description="The videos themselves won't be deleted."
                  onConfirm={async () => {
                    try {
                      await PlaylistAPI.remove(playlistId);
                      toast.success("Playlist deleted");
                      navigate("/playlists");
                    } catch (e) {
                      toast.error(apiErrorMessage(e));
                    }
                  }}
                  trigger={
                    <Button
                      variant="destructive"
                      size="icon"
                      aria-label="Delete playlist"
                    >
                      <Trash2 />
                    </Button>
                  }
                />
              </>
            )}
          </div>
        </div>
      </aside>

      <section>
        {!videos.length ? (
          <EmptyState
            icon={ListVideo}
            title="This playlist is empty"
            description="Use the Save button on any video to add it here."
          />
        ) : (
          <div className="surface space-y-1 rounded-xl p-3">
            {videos.map((v, i) => (
              <div key={v._id} className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-center text-sm text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <VideoRow
                    video={v}
                    actions={
                      isMine && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => removeVideo(v._id)}
                          aria-label="Remove from playlist"
                        >
                          <X />
                        </Button>
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EditPlaylistDialog({
  playlist,
  onSaved,
}: {
  playlist: Playlist;
  onSaved: (p: Playlist) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const p = await PlaylistAPI.update(playlist._id, {
        name: name.trim(),
        description: description.trim(),
      });
      onSaved(p);
      setOpen(false);
      toast.success("Playlist updated");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="icon" aria-label="Edit playlist">
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit playlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pl-name">Name</Label>
            <Input
              id="pl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pl-desc">Description</Label>
            <Textarea
              id="pl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
