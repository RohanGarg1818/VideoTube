import { useState, type FormEvent } from "react";
import { ListVideo, Plus } from "lucide-react";
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
import { PlaylistAPI } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { PlaylistCard } from "../components/PlaylistCard";
import { VideoGridSkeleton } from "../components/VideoCard";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage } from "../services/api";
import { plural } from "../lib/format";
import { toast } from "sonner";

export function MyPlaylistsPage() {
  const me = useAuthStore((s) => s.user)!;
  const { data, loading, errorMessage, refetch } = useAsync(
    () => PlaylistAPI.byUser(me._id),
    [me._id],
  );
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await PlaylistAPI.create({ name: name.trim(), description: desc.trim() });
      toast.success("Playlist created");
      setOpen(false);
      setName("");
      setDesc("");
      refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const createButton = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> New playlist
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create playlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={create} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              placeholder="e.g. Watch later"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div>
      <PageHeader
        icon={ListVideo}
        title="Your playlists"
        subtitle={data ? plural(data.length, "playlist") : undefined}
        actions={createButton}
      />
      {loading ? (
        <VideoGridSkeleton count={4} />
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={refetch} />
      ) : !data?.length ? (
        <EmptyState
          icon={ListVideo}
          title="No playlists yet"
          description="Organize videos into collections you can come back to."
          action={createButton}
        />
      ) : (
        <div className="grid grid-cols-1 gap-x-5 gap-y-10 pt-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {data.map((p) => (
            <PlaylistCard key={p._id} playlist={p} />
          ))}
        </div>
      )}
    </div>
  );
}
