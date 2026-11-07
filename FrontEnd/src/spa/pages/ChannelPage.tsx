import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, Film, ListVideo, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AuthAPI,
  CommunityAPI,
  PlaylistAPI,
  SubAPI,
  VideoAPI,
  type Channel,
} from "../services/endpoints";
import { useAsync, usePaginated } from "../hooks/useAsync";
import { ErrorState, EmptyState } from "../components/EmptyState";
import {
  VideoCard,
  VideoGrid,
  VideoGridSkeleton,
} from "../components/VideoCard";
import { PlaylistCard } from "../components/PlaylistCard";
import { PostCard } from "../components/PostCard";
import { LoadMore } from "../components/LoadMore";
import { UserAvatar } from "../components/UserAvatar";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage, isNotFoundError } from "../services/api";
import { formatCount, formatDate } from "../lib/format";
import { toast } from "sonner";

export function ChannelPage() {
  const { username } = useParams<{ username: string }>();
  const me = useAuthStore((s) => s.user);
  const {
    data: channel,
    loading,
    error,
    errorMessage,
    refetch,
    setData,
  } = useAsync<Channel | null>(
    () => (username ? AuthAPI.channelByName(username) : Promise.resolve(null)),
    [username, me?._id],
  );
  const [busy, setBusy] = useState(false);

  if (loading && !channel) {
    return (
      <div>
        <div className="skeleton aspect-[5/1] w-full rounded-xl" />
        <div className="skeleton mt-4 h-28 rounded-xl" />
      </div>
    );
  }
  if (error)
    return (
      <ErrorState
        message={
          isNotFoundError(error)
            ? "This channel doesn't exist."
            : (errorMessage ?? "")
        }
        onRetry={refetch}
      />
    );
  if (!channel) return null;

  const isMine = me?._id === channel._id;

  const toggleSub = async () => {
    if (!me) return toast.error("Sign in to subscribe");
    setBusy(true);
    try {
      const res = await SubAPI.toggle(channel._id);
      setData({
        ...channel,
        isSubscribed: res.isSubscribed,
        subscribersCount: res.subscribersCount,
      });
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const stats = [
    { label: "Subscribers", value: channel.subscribersCount },
    { label: "Videos", value: channel.videosCount },
    { label: "Total views", value: channel.totalViews },
  ];

  return (
    <div>
      {channel.coverImage && (
        <div className="aspect-[6/1] w-full overflow-hidden rounded-xl bg-zinc-800">
          <img
            src={channel.coverImage}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <UserAvatar
          src={channel.avatar}
          name={channel.fullName}
          className="h-20 w-20 text-2xl md:h-28 md:w-28"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-[-0.02em] md:text-[32px] md:leading-tight">
            {channel.fullName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground/90">
              @{channel.username}
            </span>
            {stats.map((s) => (
              <span key={s.label}>
                {" · "}
                {formatCount(s.value ?? 0)} {s.label.toLowerCase()}
              </span>
            ))}
          </p>
          {channel.createdAt && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Joined {formatDate(channel.createdAt)}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            {isMine ? (
              <>
                <Button variant="secondary" className="rounded-full" asChild>
                  <Link to="/settings">Customize channel</Link>
                </Button>
                <Button variant="secondary" className="rounded-full" asChild>
                  <Link to="/studio">Manage videos</Link>
                </Button>
              </>
            ) : (
              <Button
                onClick={toggleSub}
                disabled={busy}
                variant={channel.isSubscribed ? "secondary" : "default"}
                className="rounded-full px-4"
              >
                {channel.isSubscribed && <Check />}
                {channel.isSubscribed ? "Subscribed" : "Subscribe"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="videos" className="mt-6">
        <TabsList>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="community">Posts</TabsTrigger>
        </TabsList>
        <TabsContent value="videos" className="mt-6">
          <ChannelVideos userId={channel._id} />
        </TabsContent>
        <TabsContent value="playlists" className="mt-8">
          <ChannelPlaylists userId={channel._id} />
        </TabsContent>
        <TabsContent value="community" className="mt-6">
          <ChannelCommunity channelId={channel._id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChannelVideos({ userId }: { userId: string }) {
  const {
    items,
    hasMore,
    loading,
    loadingMore,
    errorMessage,
    loadMore,
    reload,
  } = usePaginated(
    (page) => VideoAPI.list({ userId, page, limit: 12 }),
    [userId],
  );
  if (loading) return <VideoGridSkeleton count={4} />;
  if (errorMessage)
    return <ErrorState message={errorMessage} onRetry={reload} />;
  if (!items.length)
    return (
      <EmptyState
        icon={Film}
        title="No videos yet"
        description="This channel hasn't uploaded anything."
      />
    );
  return (
    <>
      <VideoGrid>
        {items.map((v, i) => (
          <VideoCard key={v._id} video={v} index={i % 12} />
        ))}
      </VideoGrid>
      <LoadMore hasMore={hasMore} loading={loadingMore} onLoadMore={loadMore} />
    </>
  );
}

function ChannelPlaylists({ userId }: { userId: string }) {
  const { data, loading, errorMessage, refetch } = useAsync(
    () => PlaylistAPI.byUser(userId),
    [userId],
  );
  if (loading) return <VideoGridSkeleton count={3} />;
  if (errorMessage)
    return <ErrorState message={errorMessage} onRetry={refetch} />;
  if (!data?.length)
    return <EmptyState icon={ListVideo} title="No playlists" />;
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {data.map((p) => (
        <PlaylistCard key={p._id} playlist={p} />
      ))}
    </div>
  );
}

function ChannelCommunity({ channelId }: { channelId: string }) {
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
  } = usePaginated(
    (page) => CommunityAPI.byChannel(channelId, { page, limit: 10 }),
    [channelId, me?._id],
  );
  if (loading) return <div className="skeleton h-32 max-w-2xl rounded-xl" />;
  if (errorMessage)
    return <ErrorState message={errorMessage} onRetry={reload} />;
  if (!items.length)
    return <EmptyState icon={MessageSquare} title="No posts yet" />;
  return (
    <div className="max-w-2xl space-y-4">
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
      <LoadMore hasMore={hasMore} loading={loadingMore} onLoadMore={loadMore} />
    </div>
  );
}
