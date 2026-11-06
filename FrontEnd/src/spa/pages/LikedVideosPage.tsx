import { Heart } from "lucide-react";
import { LikeAPI } from "../services/endpoints";
import { usePaginated } from "../hooks/useAsync";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import {
  VideoCard,
  VideoGrid,
  VideoGridSkeleton,
} from "../components/VideoCard";
import { LoadMore } from "../components/LoadMore";
import { plural } from "../lib/format";

export function LikedVideosPage() {
  const {
    items,
    total,
    hasMore,
    loading,
    loadingMore,
    errorMessage,
    loadMore,
    reload,
  } = usePaginated((page) => LikeAPI.likedVideos({ page, limit: 16 }), []);
  return (
    <div>
      <PageHeader
        icon={Heart}
        title="Liked videos"
        subtitle={loading ? "Loading…" : plural(total, "video")}
      />
      {loading ? (
        <VideoGridSkeleton count={4} />
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={reload} />
      ) : !items.length ? (
        <EmptyState
          icon={Heart}
          title="No liked videos"
          description="Tap the heart on any video to save it here."
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
