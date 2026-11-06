import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CommunityAPI,
  LikeAPI,
  type CommunityPost,
} from "../services/endpoints";
import { apiErrorMessage } from "../services/api";
import { formatCount, getOwner, timeAgo } from "../lib/format";
import { UserAvatar } from "./UserAvatar";
import { ConfirmDialog } from "./ConfirmDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PostCard({
  post,
  currentUserId,
  onUpdated,
  onDeleted,
}: {
  post: CommunityPost;
  currentUserId?: string;
  onUpdated: (p: CommunityPost) => void;
  onDeleted: (id: string) => void;
}) {
  const owner = getOwner(post);
  const isMine = Boolean(owner?._id && owner._id === currentUserId);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(post.content);

  const save = async () => {
    try {
      const updated = await CommunityAPI.update(post._id, value);
      onUpdated({
        ...post,
        ...updated,
        likesCount: post.likesCount,
        isLiked: post.isLiked,
      });
      setEditing(false);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const like = async () => {
    if (!currentUserId) return toast.error("Sign in to like posts");
    const prev = post;
    onUpdated({
      ...post,
      isLiked: !post.isLiked,
      likesCount: (post.likesCount ?? 0) + (post.isLiked ? -1 : 1),
    });
    try {
      const res = await LikeAPI.toggleCommunity(post._id);
      onUpdated({
        ...post,
        isLiked: res.isCommunityLiked,
        likesCount: res.likesCount,
      });
    } catch (e) {
      onUpdated(prev);
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <article className="glass glass-hover animate-fade-up rounded-3xl p-5">
      <div className="flex items-center gap-3">
        <Link to={owner ? `/channel/${owner.username}` : "#"}>
          <UserAvatar
            src={owner?.avatar}
            name={owner?.fullName}
            className="h-10 w-10"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={owner ? `/channel/${owner.username}` : "#"}
            className="block truncate text-sm font-semibold hover:underline"
          >
            {owner?.fullName ?? "Unknown"}
          </Link>
          <p className="text-xs text-muted-foreground">
            @{owner?.username} · {timeAgo(post.createdAt)}
          </p>
        </div>
      </div>

      {editing ? (
        <div className="mt-4 space-y-2">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            maxLength={2000}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={!value.trim()}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 whitespace-pre-wrap break-words leading-relaxed text-foreground/90">
          {post.content}
        </p>
      )}

      {!editing && (
        <div className="mt-4 flex items-center gap-1 border-t border-white/10 pt-3">
          <button
            onClick={like}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-white/10",
              post.isLiked ? "text-pink-400" : "text-muted-foreground",
            )}
          >
            <Heart className={cn("h-4 w-4", post.isLiked && "fill-current")} />{" "}
            {formatCount(post.likesCount ?? 0)}
          </button>
          {isMine && (
            <div className="ml-auto flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Pencil /> Edit
              </Button>
              <ConfirmDialog
                title="Delete post?"
                description="This post and its likes will be removed permanently."
                onConfirm={async () => {
                  try {
                    await CommunityAPI.remove(post._id);
                    onDeleted(post._id);
                    toast.success("Post deleted");
                  } catch (e) {
                    toast.error(apiErrorMessage(e));
                  }
                }}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-300 hover:text-red-200"
                  >
                    <Trash2 /> Delete
                  </Button>
                }
              />
            </div>
          )}
        </div>
      )}
    </article>
  );
}
