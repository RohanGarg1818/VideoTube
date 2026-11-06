import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Clock,
  Film,
  Flame,
  Heart,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
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

const SORTS: { key: VideoSort; label: string; icon: typeof Clock }[] = [
  { key: "createdAt", label: "Latest", icon: Clock },
  { key: "views", label: "Most viewed", icon: Flame },
  { key: "likes", label: "Most liked", icon: Heart },
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
      {!query && defaultSort === "createdAt" && (
        <section className="glass relative mb-8 animate-fade-up overflow-hidden rounded-3xl p-6 md:p-10">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/30 blur-3xl" />
          <div className="absolute -bottom-24 right-40 h-60 w-60 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-fuchsia-200">
              <Sparkles className="h-3.5 w-3.5" /> Fresh from creators
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
              {user ? (
                <>
                  Welcome back,{" "}
                  <span className="text-gradient">
                    {user.fullName.split(" ")[0]}
                  </span>
                </>
              ) : (
                <>
                  Discover videos{" "}
                  <span className="text-gradient">worth watching</span>
                </>
              )}
            </h1>
            <p className="mt-3 text-muted-foreground md:text-lg">
              Explore the latest uploads, follow creators you love and share
              your own story.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to={user ? "/upload" : "/signup"}>
                  <Upload /> {user ? "Upload a video" : "Get started"}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/explore">
                  <Flame /> Trending now
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {query ? (
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Search className="h-5 w-5 text-fuchsia-300" />
            {loading
              ? "Searching…"
              : `${total} result${total === 1 ? "" : "s"} for`}{" "}
            <span className="text-gradient">"{query}"</span>
          </h2>
        ) : (
          <h2 className="text-xl font-bold tracking-tight">
            {defaultSort === "views" ? "Trending" : "Recommended"}
          </h2>
        )}
        <div className="glass flex gap-1 rounded-full p-1">
          {SORTS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                sortBy === key
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/25"
                  : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
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
          title={query ? `No results for "${query}"` : "No videos yet"}
          description={
            query
              ? "Try different keywords."
              : "Be the first to upload something amazing."
          }
          action={
            user && !query ? (
              <Button asChild>
                <Link to="/upload">
                  <Upload /> Upload video
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <VideoGrid>
            {items.map((v, i) => (
              <VideoCard key={v._id} video={v} index={i % 16} />
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
