import { Loader2 } from "lucide-react";
import { useInView } from "../hooks/useAsync";

/** Invisible sentinel that triggers `onLoadMore` as it approaches the viewport (infinite scroll). */
export function LoadMore({
  hasMore,
  loading,
  onLoadMore,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}) {
  const ref = useInView(onLoadMore, hasMore);
  if (!hasMore && !loading) return null;
  return (
    <div ref={ref} className="flex justify-center py-8 text-muted-foreground">
      {loading && <Loader2 className="h-6 w-6 animate-spin" />}
    </div>
  );
}
