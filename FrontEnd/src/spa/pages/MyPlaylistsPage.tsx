import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
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
import { Plus } from "lucide-react";
import { PlaylistAPI } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage } from "../services/api";
import { toast } from "sonner";

export function MyPlaylistsPage() {
  const me = useAuthStore((s) => s.user)!;
  const { data, loading, error, errorMessage, refetch } = useAsync(
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
      await PlaylistAPI.create({ name, description: desc });
      toast.success("Playlist created");
      setOpen(false);
      setName("");
      setDesc("");
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your playlists</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New playlist</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create playlist</DialogTitle>
            </DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <ErrorState message={errorMessage || "Something went wrong"} onRetry={refetch} />}
      {!loading && !error && !data?.length && <EmptyState title="No playlists yet" />}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((p) => (
          <Link key={p._id} to={`/playlist/${p._id}`} className="rounded-lg border border-border p-4 hover:bg-accent transition-colors">
            <h3 className="font-semibold">{p.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description || "No description"}</p>
            <p className="text-xs text-muted-foreground mt-2">{p.videos?.length ?? 0} videos</p>
          </Link>
        ))}
      </div>
    </div>
  );
}