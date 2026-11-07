import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Film, Plus } from "lucide-react";
import { VideoAPI, type VideoSort } from "../services/endpoints";
import { usePaginated } from "../hooks/useAsync";
import {
  VideoCard,
  VideoGrid,
  VideoGridSkeleton,
} from "../components/VideoCard";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { LoadMore } from "../components/LoadMore";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../store/authStore";
import { cn } from "@/lib/utils";

const SORTS: { key: VideoSort; label: string }[] = [
  { key: "createdAt", label: "Latest" },
  { key: "views", label: "Most viewed" },
  { key: "likes", label: "Most liked" },
];

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
        limit: 16,
        sortBy,
        sortType: "desc",
      }),
    [query, sortBy],
  );

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 mb-6 flex flex-wrap items-center gap-2 bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {query ? (
          <p className="mr-auto text-sm text-muted-foreground">
            {loading
              ? "Searching…"
              : `${total} result${total === 1 ? "" : "s"} for`}{" "}
            <span className="font-medium text-foreground">“{query}”</span>
          </p>
        ) : (
          defaultSort === "views" && (
            <h1 className="mr-4 text-lg font-semibold tracking-tight">
              Trending
            </h1>
          )
        )}
        <div className="flex gap-2">
          {SORTS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={cn(
                "h-8 rounded-lg px-3 text-[13px] font-medium transition-colors",
                sortBy === key
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-white/[0.07] text-foreground hover:bg-white/[0.11]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <VideoGridSkeleton />
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={reload} />
      ) : !items.length ? (
        <EmptyState
          icon={Film}
          title={query ? "No results found" : "No videos yet"}
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
          <VideoGrid>
            {items.map((v) => (
              <VideoCard key={v._id} video={v} />
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
