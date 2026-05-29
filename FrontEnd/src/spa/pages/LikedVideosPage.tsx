import { LikeAPI } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { VideoCard, VideoCardSkeleton } from "../components/VideoCard";
import { ThumbsUp } from "lucide-react";

export function LikedVideosPage() {
  const { data, loading, error, refetch } = useAsync(() => LikeAPI.likedVideos(), []);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Liked videos</h1>
      {loading && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <VideoCardSkeleton key={i} />)}
        </div>
      )}
      {error && <ErrorState message={errorMessage || "Something went wrong"} onRetry={refetch} />}
      {!loading && !error && !data?.length && (
        <EmptyState icon={ThumbsUp} title="No liked videos" description="Videos you like will show up here." />
      )}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data?.map((v) => <VideoCard key={v._id} video={v} />)}
      </div>
    </div>
  );
}