import { AuthAPI } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { VideoCard, VideoCardSkeleton } from "../components/VideoCard";
import { History } from "lucide-react";

export function HistoryPage() {
  const { data, loading, error, refetch } = useAsync(() => AuthAPI.watchHistory(), []);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Watch history</h1>
      {loading && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <VideoCardSkeleton key={i} />)}
        </div>
      )}
      {error && <ErrorState message={error?.message || "Something went wrong"} onRetry={refetch} />}
      {!loading && !error && !data?.length && (
        <EmptyState icon={History} title="No history yet" description="Watch some videos to fill this up." />
      )}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data?.map((v) => <VideoCard key={v._id} video={v} />)}
      </div>
    </div>
  );
}