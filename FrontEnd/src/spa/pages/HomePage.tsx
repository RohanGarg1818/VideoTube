import { useSearchParams } from "react-router-dom";
import { VideoAPI, type Video } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { VideoCard, VideoCardSkeleton } from "../components/VideoCard";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { Film } from "lucide-react";

function getDocs(payload: unknown): Video[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && "docs" in payload) {
    return (payload as { docs: Video[] }).docs ?? [];
  }
  return [];
}

export function HomePage() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  const { data, loading, error, refetch } = useAsync(
    () => VideoAPI.list({ query, limit: 24, sortBy: "createdAt", sortType: "desc" }),
    [query],
  );

  if (loading) {
    return (
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <VideoCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (error) return <ErrorState message={errorMessage || "Something went wrong"} onRetry={refetch} />;

  const videos = getDocs(data);
  if (!videos.length) {
    return (
      <EmptyState
        icon={Film}
        title={query ? `No results for "${query}"` : "No videos yet"}
        description="Try a different search or check back later."
      />
    );
  }

  return (
    <div>
      {query && (
        <h2 className="mb-4 text-lg font-semibold">
          Results for <span className="text-primary">"{query}"</span>
        </h2>
      )}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((v) => (
          <VideoCard key={v._id} video={v} />
        ))}
      </div>
    </div>
  );
}