import { Link } from "react-router-dom";
import { Users, Film } from "lucide-react";
import { SubAPI } from "../services/endpoints";
import { useAsync, usePaginated } from "../hooks/useAsync";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import {
  VideoCard,
  VideoGrid,
  VideoGridSkeleton,
} from "../components/VideoCard";
import { LoadMore } from "../components/LoadMore";
import { UserAvatar } from "../components/UserAvatar";
import { useAuthStore } from "../store/authStore";
import { plural } from "../lib/format";
import { Button } from "@/components/ui/button";

export function SubscriptionsPage() {
  const me = useAuthStore((s) => s.user)!;
  const channels = useAsync(() => SubAPI.subscribedTo(me._id), [me._id]);
  const feed = usePaginated(
    (page) => SubAPI.feed({ page, limit: 12 }),
    [me._id],
  );

  const list = channels.data ?? [];

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Subscriptions"
        subtitle={
          channels.loading
            ? "Loading…"
            : `You follow ${plural(list.length, "channel")}`
        }
      />

      {channels.errorMessage && (
        <ErrorState
          message={channels.errorMessage}
          onRetry={channels.refetch}
        />
      )}

      {!channels.loading && !channels.errorMessage && !list.length ? (
        <EmptyState
          icon={Users}
          title="No subscriptions yet"
          description="Subscribe to creators to see their newest uploads here."
          action={
            <Button asChild>
              <Link to="/explore">Discover channels</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="-mx-1 mb-10 flex gap-3 overflow-x-auto px-1 pb-2">
            {channels.loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="skeleton h-36 w-32 shrink-0 rounded-xl"
                  />
                ))
              : list.map(({ channel }) =>
                  channel ? (
                    <Link
                      key={channel._id}
                      to={`/channel/${channel.username}`}
                      className="surface surface-hover flex w-36 shrink-0 flex-col items-center rounded-xl p-4 text-center"
                    >
                      <UserAvatar
                        src={channel.avatar}
                        name={channel.fullName}
                        className="h-16 w-16"
                        ring
                      />
                      <p className="mt-3 w-full truncate text-sm font-semibold">
                        {channel.fullName}
                      </p>
                      <p className="w-full truncate text-[11px] text-muted-foreground">
                        {plural(channel.subscribersCount, "subscriber")}
                      </p>
                    </Link>
                  ) : null,
                )}
          </div>

          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            Latest from your channels
          </h2>
          {feed.loading ? (
            <VideoGridSkeleton count={4} />
          ) : feed.errorMessage ? (
            <ErrorState message={feed.errorMessage} onRetry={feed.reload} />
          ) : !feed.items.length ? (
            <EmptyState
              icon={Film}
              title="Nothing new yet"
              description="Your channels haven't uploaded anything yet."
            />
          ) : (
            <>
              <VideoGrid>
                {feed.items.map((v, i) => (
                  <VideoCard key={v._id} video={v} index={i % 12} />
                ))}
              </VideoGrid>
              <LoadMore
                hasMore={feed.hasMore}
                loading={feed.loadingMore}
                onLoadMore={feed.loadMore}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
