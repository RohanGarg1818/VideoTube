import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CommunityAPI } from "../services/endpoints";
import { usePaginated } from "../hooks/useAsync";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { PostCard } from "../components/PostCard";
import { LoadMore } from "../components/LoadMore";
import { UserAvatar } from "../components/UserAvatar";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage } from "../services/api";
import { toast } from "sonner";

export function CommunityPage() {
  const me = useAuthStore((s) => s.user);
  const {
    items,
    setItems,
    hasMore,
    loading,
    loadingMore,
    errorMessage,
    loadMore,
    reload,
  } = usePaginated((page) => CommunityAPI.feed({ page, limit: 10 }), [me?._id]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      const post = await CommunityAPI.create(content.trim());
      setItems((prev) => [post, ...prev]);
      setContent("");
      toast.success("Posted");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        icon={MessageSquare}
        eyebrow="The board"
        title="Community"
        subtitle="Updates, thoughts and announcements from creators"
      />

      {me ? (
        <form onSubmit={create} className="surface mb-6 rounded-xl p-5">
          <div className="flex gap-3">
            <UserAvatar
              src={me.avatar}
              name={me.fullName}
              className="h-10 w-10"
            />
            <Textarea
              placeholder={`What's on your mind, ${me.fullName.split(" ")[0]}?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              maxLength={2000}
              className="border-0 bg-transparent px-0 text-base shadow-none hover:border-0 focus-visible:bg-transparent focus-visible:ring-0"
            />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-xs text-muted-foreground">
              {content.length}/2000
            </span>
            <Button
              type="submit"
              size="sm"
              className="rounded-full px-5"
              disabled={posting || !content.trim()}
            >
              <Send /> {posting ? "Posting…" : "Post"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="surface mb-6 rounded-xl p-5 text-sm text-muted-foreground">
          <Link
            to="/login"
            className="font-medium text-foreground underline underline-offset-4 decoration-white/30 hover:decoration-white"
          >
            Sign in
          </Link>{" "}
          to share a post with the community.
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-xl" />
          ))}
        </div>
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={reload} />
      ) : !items.length ? (
        <EmptyState
          icon={MessageSquare}
          title="No posts yet"
          description="Start the conversation!"
        />
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <PostCard
              key={p._id}
              post={p}
              currentUserId={me?._id}
              onUpdated={(u) =>
                setItems((prev) => prev.map((x) => (x._id === u._id ? u : x)))
              }
              onDeleted={(id) =>
                setItems((prev) => prev.filter((x) => x._id !== id))
              }
            />
          ))}
          <LoadMore
            hasMore={hasMore}
            loading={loadingMore}
            onLoadMore={loadMore}
          />
        </div>
      )}
    </div>
  );
}
