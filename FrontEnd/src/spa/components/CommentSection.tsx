import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2 } from "lucide-react";
import { CommentAPI, type Comment } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage } from "../services/api";
import { getOwner, timeAgo } from "../lib/format";
import { toast } from "sonner";

function getDocs(payload: unknown): Comment[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && "docs" in payload) {
    return (payload as { docs: Comment[] }).docs ?? [];
  }
  return [];
}

export function CommentSection({ videoId, channelId }: { videoId: string; channelId: string }) {
  const user = useAuthStore((s) => s.user);
  const { data, loading, error, refetch } = useAsync(() => CommentAPI.list(videoId), [videoId]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const comments = getDocs(data);

  const add = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await CommentAPI.add(channelId, videoId, text.trim());
      setText("");
      await refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-4">{comments.length} Comments</h2>
      {user ? (
        <div className="flex gap-3 mb-6">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.fullName?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setText("")} disabled={!text}>
                Cancel
              </Button>
              <Button onClick={add} disabled={posting || !text.trim()}>
                Comment
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-6">
          <Link to="/login" className="text-primary hover:underline">Sign in</Link> to comment.
        </p>
      )}

      {loading && <p className="text-sm text-muted-foreground">Loading comments…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-5">
        {comments.map((c) => (
          <CommentItem key={c._id} comment={c} onChanged={refetch} currentUserId={user?._id} />
        ))}
      </div>
    </section>
  );
}

function CommentItem({
  comment,
  onChanged,
  currentUserId,
}: {
  comment: Comment;
  onChanged: () => void;
  currentUserId?: string;
}) {
  const owner = getOwner(comment);
  const isMine = owner?._id && currentUserId && owner._id === currentUserId;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(comment.content);

  const save = async () => {
    try {
      await CommentAPI.update(comment._id, value);
      setEditing(false);
      onChanged();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };
  const remove = async () => {
    if (!confirm("Delete this comment?")) return;
    try {
      await CommentAPI.remove(comment._id);
      onChanged();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="flex gap-3">
      <Avatar className="h-9 w-9">
        <AvatarImage src={owner?.avatar} />
        <AvatarFallback>{owner?.fullName?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{owner?.fullName ?? "Unknown"}</span>
          <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
        </div>
        {editing ? (
          <div className="mt-2 space-y-2">
            <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={2} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={save}>Save</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
        )}
        {isMine && !editing && (
          <div className="flex gap-2 mt-1">
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-7 px-2">
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={remove} className="h-7 px-2 text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}