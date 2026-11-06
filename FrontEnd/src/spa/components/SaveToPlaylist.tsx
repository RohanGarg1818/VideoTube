import { useState } from "react";
import { Check, ListPlus, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlaylistAPI, type Playlist } from "../services/endpoints";
import { apiErrorMessage } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/** Dialog listing the user's playlists with one-click add/remove and inline creation. */
export function SaveToPlaylist({ videoId }: { videoId: string }) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [name, setName] = useState("");

  const load = async () => {
    if (!user) return;
    try {
      setPlaylists(await PlaylistAPI.byUser(user._id));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const contains = (p: Playlist) =>
    Boolean(
      p.videos?.some((v) => (typeof v === "string" ? v : v._id) === videoId),
    );

  const toggle = async (p: Playlist) => {
    setBusy(p._id);
    try {
      if (contains(p)) {
        await PlaylistAPI.removeVideo(p._id, videoId);
        toast.success(`Removed from ${p.name}`);
      } else {
        await PlaylistAPI.addVideo(p._id, videoId);
        toast.success(`Saved to ${p.name}`);
      }
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const create = async () => {
    if (!name.trim()) return;
    setBusy("new");
    try {
      const p = await PlaylistAPI.create({ name: name.trim() });
      await PlaylistAPI.addVideo(p._id, videoId);
      toast.success(`Saved to ${p.name}`);
      setName("");
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) load();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="rounded-full">
          <ListPlus /> Save
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Save to playlist</DialogTitle>
          <DialogDescription>Pick one or more playlists.</DialogDescription>
        </DialogHeader>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {playlists === null ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : playlists.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No playlists yet — create one below.
            </p>
          ) : (
            playlists.map((p) => {
              const inIt = contains(p);
              return (
                <button
                  key={p._id}
                  onClick={() => toggle(p)}
                  disabled={busy !== null}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/10 disabled:opacity-60"
                >
                  <span
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-md border transition-colors",
                      inIt
                        ? "border-transparent bg-gradient-to-br from-violet-500 to-fuchsia-500"
                        : "border-white/25",
                    )}
                  >
                    {busy === p._id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      inIt && <Check className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.videos?.length ?? 0}
                  </span>
                </button>
              );
            })
          )}
        </div>
        <div className="flex gap-2 border-t border-white/10 pt-4">
          <Input
            placeholder="New playlist name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            maxLength={100}
          />
          <Button
            onClick={create}
            disabled={!name.trim() || busy !== null}
            size="icon"
            aria-label="Create playlist"
          >
            {busy === "new" ? <Loader2 className="animate-spin" /> : <Plus />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
