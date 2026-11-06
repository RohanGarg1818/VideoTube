import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bell,
  BellRing,
  Film,
  LayoutDashboard,
  ListVideo,
  MessageSquare,
  Pencil,
} from "lucide-react";
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
        <div className="skeleton aspect-[5/1] w-full rounded-3xl" />
        <div className="skeleton mt-4 h-28 rounded-3xl" />
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
    <div className="animate-fade-up">
      <div className="relative aspect-[3/1] w-full overflow-hidden rounded-3xl ring-1 ring-white/10 md:aspect-[5/1]">
        {channel.coverImage ? (
          <img
            src={channel.coverImage}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-violet-600/60 via-fuchsia-600/40 to-pink-500/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="glass-strong relative z-10 mx-2 -mt-10 flex flex-wrap items-center gap-5 rounded-3xl p-5 md:mx-6 md:-mt-14 md:p-6">
        <UserAvatar
          src={channel.avatar}
          name={channel.fullName}
          className="h-20 w-20 text-2xl md:h-28 md:w-28"
          ring
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold tracking-tight md:text-3xl">
            {channel.fullName}
          </h1>
          <p className="text-sm text-muted-foreground">
            @{channel.username}{" "}
            {channel.createdAt && <>· Joined {formatDate(channel.createdAt)}</>}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {stats.map((s) => (
              <span
                key={s.label}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs"
              >
                <span className="font-bold">{formatCount(s.value ?? 0)}</span>{" "}
                <span className="text-muted-foreground">{s.label}</span>
              </span>
            ))}
          </div>
        </div>
        {isMine ? (
          <div className="flex gap-2">
            <Button variant="secondary" asChild>
              <Link to="/settings">
                <Pencil /> Customize
              </Link>
            </Button>
            <Button asChild>
              <Link to="/studio">
                <LayoutDashboard /> Studio
              </Link>
            </Button>
          </div>
        ) : (
          <Button
            onClick={toggleSub}
            disabled={busy}
            variant={channel.isSubscribed ? "secondary" : "default"}
            size="lg"
            className="rounded-full"
          >
            {channel.isSubscribed ? <BellRing /> : <Bell />}
            {channel.isSubscribed ? "Subscribed" : "Subscribe"}
          </Button>
        )}
      </div>

      <Tabs defaultValue="videos" className="mt-8">
        <TabsList>
          <TabsTrigger value="videos">
            <Film className="mr-1.5 h-4 w-4" /> Videos
          </TabsTrigger>
          <TabsTrigger value="playlists">
            <ListVideo className="mr-1.5 h-4 w-4" /> Playlists
          </TabsTrigger>
          <TabsTrigger value="community">
            <MessageSquare className="mr-1.5 h-4 w-4" /> Community
          </TabsTrigger>
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
  if (loading) return <div className="skeleton h-32 max-w-2xl rounded-3xl" />;
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
