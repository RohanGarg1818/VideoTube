import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { CommentAPI, LikeAPI, type Comment } from "../services/endpoints";
import { usePaginated } from "../hooks/useAsync";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage } from "../services/api";
import { formatCount, getOwner, timeAgo } from "../lib/format";
import { UserAvatar } from "./UserAvatar";
import { ConfirmDialog } from "./ConfirmDialog";
import { LoadMore } from "./LoadMore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CommentSection({ videoId }: { videoId: string }) {
  const user = useAuthStore((s) => s.user);
  const {
    items,
    setItems,
    total,
    setTotal,
    hasMore,
    loading,
    loadingMore,
    errorMessage,
    loadMore,
  } = usePaginated(
    (page) => CommentAPI.list(videoId, { page, limit: 10 }),
    [videoId, user?._id],
  );
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [posting, setPosting] = useState(false);

  const add = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const created = await CommentAPI.add(videoId, text.trim());
      setItems((prev) => [created, ...prev]);
      setTotal((t) => t + 1);
      setText("");
      setFocused(false);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setPosting(false);
    }
  };

  const replace = (c: Comment) =>
    setItems((prev) => prev.map((p) => (p._id === c._id ? { ...p, ...c } : p)));
  const remove = (id: string) => {
    setItems((prev) => prev.filter((p) => p._id !== id));
    setTotal((t) => Math.max(0, t - 1));
  };

  return (
    <section className="glass mt-6 rounded-3xl p-5 md:p-6">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="h-5 w-5 text-fuchsia-300" />
        {formatCount(total)} {total === 1 ? "Comment" : "Comments"}
      </h2>

      {user ? (
        <div className="mb-8 flex gap-3">
          <UserAvatar src={user.avatar} name={user.fullName} />
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment…"
              value={text}
              onFocus={() => setFocused(true)}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) =>
                (e.metaKey || e.ctrlKey) && e.key === "Enter" && add()
              }
              rows={focused ? 3 : 1}
              maxLength={2000}
            />
            {focused && (
              <div className="flex items-center justify-end gap-2">
                <span className="mr-auto text-xs text-muted-foreground">
                  {text.length}/2000 · ⌘/Ctrl + Enter to post
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setText("");
                    setFocused(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={add}
                  disabled={posting || !text.trim()}
                >
                  {posting ? "Posting…" : "Comment"}
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
          <Link
            to="/login"
            className="font-medium text-fuchsia-300 hover:underline"
          >
            Sign in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      {loading && (
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-32 rounded" />
                <div className="skeleton h-3 w-3/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
      {!loading && !items.length && !errorMessage && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No comments yet — be the first!
        </p>
      )}

      <div className="space-y-6">
        {items.map((c) => (
          <CommentItem
            key={c._id}
            comment={c}
            currentUserId={user?._id}
            onUpdated={replace}
            onDeleted={remove}
          />
        ))}
      </div>
      <LoadMore hasMore={hasMore} loading={loadingMore} onLoadMore={loadMore} />
    </section>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onUpdated,
  onDeleted,
}: {
  comment: Comment;
  currentUserId?: string;
  onUpdated: (c: Comment) => void;
  onDeleted: (id: string) => void;
}) {
  const owner = getOwner(comment);
  const isMine = Boolean(owner?._id && owner._id === currentUserId);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(comment.content);

  const save = async () => {
    try {
      const updated = await CommentAPI.update(comment._id, value);
      onUpdated({
        ...updated,
        likesCount: comment.likesCount,
        isLiked: comment.isLiked,
      });
      setEditing(false);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const toggleLike = async () => {
    if (!currentUserId) return toast.error("Sign in to like comments");
    // optimistic update
    const prev = comment;
    onUpdated({
      ...comment,
      isLiked: !comment.isLiked,
      likesCount: (comment.likesCount ?? 0) + (comment.isLiked ? -1 : 1),
    });
    try {
      const res = await LikeAPI.toggleComment(comment._id);
      onUpdated({
        ...comment,
        isLiked: res.isCommentLiked,
        likesCount: res.likesCount,
      });
    } catch (e) {
      onUpdated(prev);
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="group flex gap-3">
      <Link to={owner ? `/channel/${owner.username}` : "#"}>
        <UserAvatar src={owner?.avatar} name={owner?.fullName} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">
            {owner?.fullName ?? "Unknown"}
          </span>
          {owner?.username && (
            <span className="text-xs text-muted-foreground">
              @{owner.username}
            </span>
          )}
          <span className="text-xs text-muted-foreground/70">
            · {timeAgo(comment.createdAt)}
          </span>
        </div>
        {editing ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={2}
              maxLength={2000}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={!value.trim()}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
            {comment.content}
          </p>
        )}
        {!editing && (
          <div className="mt-1.5 flex items-center gap-1">
            <button
              onClick={toggleLike}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors hover:bg-white/10",
                comment.isLiked ? "text-pink-400" : "text-muted-foreground",
              )}
            >
              <Heart
                className={cn("h-3.5 w-3.5", comment.isLiked && "fill-current")}
              />
              {comment.likesCount ? formatCount(comment.likesCount) : ""}
            </button>
            {isMine && (
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="h-7 px-2 text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <ConfirmDialog
                  title="Delete comment?"
                  description="This can't be undone."
                  onConfirm={async () => {
                    try {
                      await CommentAPI.remove(comment._id);
                      onDeleted(comment._id);
                    } catch (e) {
                      toast.error(apiErrorMessage(e));
                    }
                  }}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-red-300 hover:text-red-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
