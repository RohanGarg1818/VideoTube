import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SubAPI } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { useAuthStore } from "../store/authStore";
import { Users } from "lucide-react";

export function SubscriptionsPage() {
  const me = useAuthStore((s) => s.user);
  const { data, loading, error, errorMessage, refetch } = useAsync(
    () => (me ? SubAPI.subscribedTo(me._id) : Promise.resolve([])),
    [me?._id],
  );

  if (!me) {
    return <ErrorState message="Please log in to view subscriptions" onRetry={() => window.location.href = "/"} />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your subscriptions</h1>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <ErrorState message={errorMessage || "Something went wrong"} onRetry={refetch} />}
      {!loading && !error && !data?.length && (
        <EmptyState icon={Users} title="No subscriptions yet" description="Subscribe to channels to see them here." />
      )}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((item) => {
          const channel = Array.isArray(item.channel) ? item.channel[0] : item.channel;
          if (!channel) return null;
          
          return (
            <Link key={channel._id} to={`/channel/${channel.username}`} className="group rounded-lg border border-border overflow-hidden hover:border-primary transition-colors">
              {/* Cover Image */}
              <div className="aspect-[6/1] w-full overflow-hidden bg-muted">
                {channel.coverImage ? (
                  <img src={channel.coverImage} alt="" className="h-full w-full object-cover group-hover:opacity-80 transition-opacity" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-muted to-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex gap-3">
                  <Avatar className="h-12 w-12 -mt-8 border-2 border-background">
                    <AvatarImage src={channel.avatar} />
                    <AvatarFallback>{channel.fullName?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{channel.fullName}</h3>
                    <p className="text-sm text-muted-foreground truncate">@{channel.username}</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}