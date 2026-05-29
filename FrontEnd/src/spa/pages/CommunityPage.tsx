import { useState, type FormEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2 } from "lucide-react";
import { CommunityAPI, type CommunityPost } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage } from "../services/api";
import { getOwner, timeAgo } from "../lib/format";
import { toast } from "sonner";

export function CommunityPage() {
  const me = useAuthStore((s) => s.user);
  const { data, loading, error, errorMessage, refetch } = useAsync(() => CommunityAPI.feed(), []);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      await CommunityAPI.create(content.trim());
      setContent("");
      toast.success("Posted");
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Community</h1>
      {me && (
        <form onSubmit={create} className="flex gap-3 mb-6">
          <Avatar className="h-9 w-9">
            <AvatarImage src={me.avatar} />
            <AvatarFallback>{me.fullName?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Share something…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={posting || !content.trim()}>Post</Button>
            </div>
          </div>
        </form>
      )}
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <ErrorState message={errorMessage || "Something went wrong"} onRetry={refetch} />}
      {!loading && !error && !data?.length && <EmptyState title="No posts yet" />}
      <div className="space-y-4">
        {data?.map((p) => (
          <PostItem key={p._id} post={p} currentUserId={me?._id} onChanged={refetch} />
        ))}
      </div>
    </div>
  );
}

function PostItem({
  post,
  currentUserId,
  onChanged,
}: {
  post: CommunityPost;
  currentUserId?: string;
  onChanged: () => void;
}) {
  const owner = getOwner(post);
  const ownerIdToCompare = (post.owner && typeof post.owner === "object" && "_id" in post.owner)
    ? post.owner._id
    : (typeof post.owner === "string" ? post.owner : undefined);

  const isMine = ownerIdToCompare && currentUserId && ownerIdToCompare === currentUserId;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(post.content);

  const save = async () => {
    try {
      await CommunityAPI.update(post._id, value);
      setEditing(false);
      onChanged();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const remove = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await CommunityAPI.remove(post._id);
      onChanged();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={owner?.avatar} />
          <AvatarFallback>{owner?.fullName?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{owner?.fullName ?? "Unknown"}</p>
          <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
        </div>
      </div>
      {editing ? (
        <div className="mt-3 space-y-2">
          <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={3} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={save}>Save</Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap break-words">{post.content}</p>
      )}
      {isMine && !editing && (
        <div className="flex gap-2 mt-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-7 px-2">
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={remove} className="h-7 px-2 text-destructive">
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
        </div>
      )}
    </div>
  );
}