import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Film, Play, Plus } from "lucide-react";
import { VideoAPI, type Video, type VideoSort } from "../services/endpoints";
import { usePaginated } from "../hooks/useAsync";
import {
  VideoCard,
  VideoGrid,
  VideoGridSkeleton,
} from "../components/VideoCard";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { SectionHeading } from "../components/PageHeader";
import { LoadMore } from "../components/LoadMore";
import { UserAvatar } from "../components/UserAvatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../store/authStore";
import { formatDuration, formatViews, getOwner, timeAgo } from "../lib/format";
import { cn } from "@/lib/utils";

const SORTS: { key: VideoSort; label: string; heading: string }[] = [
  { key: "createdAt", label: "Latest", heading: "Fresh uploads" },
  { key: "views", label: "Most viewed", heading: "Most watched" },
  { key: "likes", label: "Most liked", heading: "Crowd favourites" },
];

function Featured({ video }: { video: Video }) {
  const owner = getOwner(video);
  return (
    <section className="group mb-14 grid animate-rise items-center gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <Link
        to={`/watch/${video._id}`}
        className="relative block overflow-hidden rounded-2xl"
      >
        <div className="relative aspect-video bg-[var(--color-card)]">
          {video.thumbnail && (
            <img
              src={video.thumbnail}
              alt=""
              className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.07]" />
          <span className="absolute bottom-4 left-4 grid h-12 w-12 place-items-center rounded-full bg-brand text-[oklch(0.16_0.02_45)] transition-transform duration-300 group-hover:scale-110">
            <Play className="h-5 w-5 translate-x-px fill-current" />
          </span>
          <span className="absolute bottom-4 right-4 rounded-md bg-black/70 px-2 py-1 font-mono text-xs tabular-nums text-white">
            {formatDuration(video.duration)}
          </span>
          <span className="scrubber group-hover:scale-x-100" />
        </div>
      </Link>

      <div>
        <p className="eyebrow flex items-center gap-2.5">
          <span className="rec-dot" /> Now showing
        </p>
        <Link to={`/watch/${video._id}`}>
          <h1 className="display mt-5 line-clamp-3 text-[44px] leading-[0.98] md:text-[60px]">
            {video.title}
          </h1>
        </Link>
        {video.description && (
          <p className="mt-5 line-clamp-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            {video.description}
          </p>
        )}

        {owner && (
          <Link
            to={`/channel/${owner.username}`}
            className="mt-6 flex w-fit items-center gap-3"
          >
            <UserAvatar
              src={owner.avatar}
              name={owner.fullName}
              className="h-9 w-9"
            />
            <span className="text-sm font-medium hover:underline">
              {owner.fullName}
            </span>
          </Link>
        )}

        <dl className="mt-6 flex gap-8 border-t border-[var(--color-border)] pt-5">
          {[
            ["Views", formatViews(video.views)],
            ["Likes", formatViews(video.likes)],
            ["Released", timeAgo(video.createdAt)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="eyebrow text-[10px]">{k}</dt>
              <dd className="mt-1.5 font-mono text-sm">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-7 flex gap-2">
          <Button size="lg" asChild>
            <Link to={`/watch/${video._id}`}>
              <Play className="fill-current" /> Watch now
            </Link>
          </Button>
          {owner && (
            <Button size="lg" variant="outline" asChild>
              <Link to={`/channel/${owner.username}`}>
                Visit channel <ArrowUpRight />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

export function HomePage({
  defaultSort = "createdAt",
}: {
  defaultSort?: VideoSort;
}) {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  const user = useAuthStore((s) => s.user);
  const [sortBy, setSortBy] = useState<VideoSort>(defaultSort);

  const {
    items,
    total,
    hasMore,
    loading,
    loadingMore,
    errorMessage,
    loadMore,
    reload,
  } = usePaginated(
    (page) =>
      VideoAPI.list({
        query: query || undefined,
        page,
        limit: 17,
        sortBy,
        sortType: "desc",
      }),
    [query, sortBy],
  );

  const showFeatured = !query && items.length > 3;
  const [featured, ...rest] = items;
  const grid = showFeatured ? rest : items;
  const current = SORTS.find((s) => s.key === sortBy)!;

  const tuner = (
    <div className="flex items-center gap-1 rounded-full border border-[var(--color-border)] p-1">
      {SORTS.map(({ key, label }, i) => (
        <button
          key={key}
          onClick={() => setSortBy(key)}
          className={cn(
            "flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] transition-colors",
            sortBy === key
              ? "bg-brand-soft text-brand"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="font-mono text-[10px] opacity-70">0{i + 1}</span>
          {label}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div>
        <div className="mb-14 grid gap-8 lg:grid-cols-[7fr_5fr]">
          <div className="skeleton aspect-video rounded-2xl" />
          <div className="space-y-4 self-center">
            <div className="skeleton h-3 w-28 rounded" />
            <div className="skeleton h-14 w-full rounded" />
            <div className="skeleton h-14 w-2/3 rounded" />
          </div>
        </div>
        <VideoGridSkeleton />
      </div>
    );
  }

  if (errorMessage)
    return <ErrorState message={errorMessage} onRetry={reload} />;

  return (
    <div>
      {query && (
        <div className="mb-10">
          <p className="eyebrow mb-3">
            Search · {total} result{total === 1 ? "" : "s"}
          </p>
          <h1 className="display text-[44px] md:text-[56px]">
            <span className="italic text-muted-foreground">“</span>
            {query}
            <span className="italic text-muted-foreground">”</span>
          </h1>
        </div>
      )}

      {!items.length ? (
        <EmptyState
          icon={Film}
          title={query ? "Nothing on this reel" : "The screen is empty"}
          description={
            query
              ? "Try different keywords or check the spelling."
              : "Uploads from creators will appear here."
          }
          action={
            user && !query ? (
              <Button asChild>
                <Link to="/upload">
                  <Plus /> Upload a video
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {showFeatured && featured && <Featured video={featured} />}
          <SectionHeading
            index={showFeatured ? "01" : undefined}
            title={query ? "Results" : current.heading}
            right={tuner}
          />
          <VideoGrid>
            {grid.map((v, i) => (
              <VideoCard key={v._id} video={v} index={i} />
            ))}
          </VideoGrid>
          <LoadMore
            hasMore={hasMore}
            loading={loadingMore}
            onLoadMore={loadMore}
          />
        </>
      )}
    </div>
  );
}
