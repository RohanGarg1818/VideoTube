import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil } from "lucide-react";
import { AuthAPI, CommunityAPI, PlaylistAPI, SubAPI, VideoAPI, type Video } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { ErrorState, EmptyState } from "../components/EmptyState";
import { VideoCard } from "../components/VideoCard";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage } from "../services/api";
import { toast } from "sonner";
import { timeAgo } from "../lib/format";

function getDocs(payload: unknown): Video[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && "docs" in payload) {
    return (payload as { docs: Video[] }).docs ?? [];
  }
  return [];
}

export function ChannelPage() {
  const { username } = useParams<{ username: string }>();
  const me = useAuthStore((s) => s.user);
  const { data: channel, loading, error, errorMessage, refetch } = useAsync(
    () => (username ? AuthAPI.channelByName(username) : Promise.resolve(null)),
    [username],
  );
  const [subscribed, setSubscribed] = useState<boolean | null>(null);

  if (loading) return <p className="text-sm text-muted-foreground">Loading channel…</p>;
  if (error) return <ErrorState message={errorMessage || "Something went wrong"} onRetry={refetch} />;
  if (!channel) return null;

  const isMine = me?._id === channel._id;
  const isSubbed = subscribed ?? (channel as { isSubscribed?: boolean }).isSubscribed ?? false;

  const toggleSub = async () => {
    if (!me) return toast.error("Sign in to subscribe");
    try {
      await SubAPI.toggle(channel._id);
      setSubscribed(!isSubbed);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <div className="aspect-[6/1] w-full overflow-hidden rounded-xl bg-muted">
        {channel.coverImage && (
          <img src={channel.coverImage} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={channel.avatar} />
          <AvatarFallback className="text-2xl">{channel.fullName?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{channel.fullName}</h1>
          <p className="text-sm text-muted-foreground">@{channel.username}</p>
          {"subscribersCount" in channel && (
            <p className="text-sm text-muted-foreground">
              {(channel as { subscribersCount?: number }).subscribersCount ?? 0} subscribers
            </p>
          )}
        </div>
        {isMine ? (
          <Link to="/settings">
            <Button variant="secondary"><Pencil className="h-4 w-4 mr-2" />Edit profile</Button>
          </Link>
        ) : (
          <Button onClick={toggleSub} variant={isSubbed ? "secondary" : "default"}>
            {isSubbed ? "Subscribed" : "Subscribe"}
          </Button>
        )}
      </div>

      <Tabs defaultValue="videos" className="mt-8">
        <TabsList>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>
        <TabsContent value="videos" className="mt-6">
          <ChannelVideos userId={channel._id} />
        </TabsContent>
        <TabsContent value="playlists" className="mt-6">
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
  const { data, loading, error, errorMessage, refetch } = useAsync(
    () => VideoAPI.list({ userId, limit: 24 }),
    [userId],
  );
  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <ErrorState message={errorMessage || "Something went wrong"} onRetry={refetch} />;
  const videos = getDocs(data);
  if (!videos.length) return <EmptyState title="No videos yet" />;
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((v) => <VideoCard key={v._id} video={v} />)}
    </div>
  );
}

function ChannelPlaylists({ userId }: { userId: string }) {
  const { data, loading, error, errorMessage, refetch } = useAsync(() => PlaylistAPI.byUser(userId), [userId]);
  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <ErrorState message={errorMessage || "Something went wrong"} onRetry={refetch} />;
  if (!data?.length) return <EmptyState title="No playlists" />;
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((p) => (
        <Link key={p._id} to={`/playlist/${p._id}`} className="rounded-lg border border-border p-4 hover:bg-accent">
          <h3 className="font-semibold">{p.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description || "No description"}</p>
          <p className="text-xs text-muted-foreground mt-2">{p.videos?.length ?? 0} videos</p>
        </Link>
      ))}
    </div>
  );
}

function ChannelCommunity({ channelId }: { channelId: string }) {
  const { data, loading, error, errorMessage, refetch } = useAsync(() => CommunityAPI.byChannel(channelId), [channelId]);
  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <ErrorState message={errorMessage || "Something went wrong"} onRetry={refetch} />;
  if (!data?.length) return <EmptyState title="No posts yet" />;
  return (
    <div className="space-y-4 max-w-2xl">
      {data.map((p) => (
        <div key={p._id} className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">{timeAgo(p.createdAt)}</p>
          <p className="mt-2 whitespace-pre-wrap">{p.content}</p>
        </div>
      ))}
    </div>
  );
}