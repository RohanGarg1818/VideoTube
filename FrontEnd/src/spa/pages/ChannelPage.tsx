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
      <div className="relative aspect-[5/1] min-h-[140px] w-full overflow-hidden rounded-2xl bg-[var(--color-card)]">
        {channel.coverImage ? (
          <img
            src={channel.coverImage}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-end p-6">
            <span className="display text-[72px] italic leading-none text-white/[0.06]">
              @{channel.username}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-transparent to-transparent" />
      </div>

      <div className="relative -mt-12 flex flex-wrap items-end gap-6 px-1 md:-mt-16 md:px-4">
        <UserAvatar
          src={channel.avatar}
          name={channel.fullName}
          className="h-24 w-24 border-4 border-[var(--color-background)] text-2xl md:h-32 md:w-32"
        />
        <div className="min-w-0 flex-1 pb-1">
          <p className="eyebrow mb-2">
            @{channel.username}
            {channel.createdAt && <> · Since {formatDate(channel.createdAt)}</>}
          </p>
          <h1 className="display truncate text-[48px] md:text-[68px]">
            {channel.fullName}
          </h1>
        </div>
        <div className="flex gap-2 pb-2">
          {isMine ? (
            <>
              <Button variant="outline" asChild>
                <Link to="/settings">Customize</Link>
              </Button>
              <Button asChild>
                <Link to="/studio">Open studio</Link>
              </Button>
            </>
          ) : (
            <Button
              onClick={toggleSub}
              disabled={busy}
              variant={channel.isSubscribed ? "secondary" : "default"}
              size="lg"
            >
              {channel.isSubscribed && <Check />}
              {channel.isSubscribed ? "Subscribed" : "Subscribe"}
            </Button>
          )}
        </div>
      </div>

      <dl className="mt-8 grid max-w-xl grid-cols-3 border-y border-[var(--color-border)]">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={
              i > 0
                ? "border-l border-[var(--color-border)] px-5 py-4"
                : "py-4 pr-5"
            }
          >
            <dt className="eyebrow text-[10px]">{s.label}</dt>
            <dd className="display mt-2 text-[34px]">
              {formatCount(s.value ?? 0)}
            </dd>
          </div>
        ))}
      </dl>

      <Tabs defaultValue="videos" className="mt-10">
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
