import { History, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthAPI } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { VideoRow } from "../components/VideoCard";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { apiErrorMessage } from "../services/api";
import { toast } from "sonner";

export function HistoryPage() {
  const { data, loading, errorMessage, refetch, setData } = useAsync(
    () => AuthAPI.watchHistory(),
    [],
  );

  const removeOne = async (id: string) => {
    setData((prev) => prev?.filter((v) => v._id !== id) ?? prev);
    try {
      await AuthAPI.removeFromHistory(id);
    } catch (e) {
      toast.error(apiErrorMessage(e));
      refetch();
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        icon={History}
        eyebrow="Library"
        title="Watch history"
        subtitle="Your 50 most recently watched videos"
        actions={
          data?.length ? (
            <ConfirmDialog
              title="Clear watch history?"
              description="This removes every video from your history."
              confirmLabel="Clear all"
              onConfirm={async () => {
                try {
                  await AuthAPI.clearHistory();
                  setData([]);
                  toast.success("History cleared");
                } catch (e) {
                  toast.error(apiErrorMessage(e));
                }
              }}
              trigger={
                <Button variant="outline">
                  <Trash2 /> Clear all
                </Button>
              }
            />
          ) : undefined
        }
      />
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={refetch} />
      ) : !data?.length ? (
        <EmptyState
          icon={History}
          title="No history yet"
          description="Videos you watch will show up here."
        />
      ) : (
        <div className="surface space-y-1 rounded-xl p-3">
          {data.map((v) => (
            <VideoRow
              key={v._id}
              video={v}
              actions={
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => removeOne(v._id)}
                  aria-label="Remove from history"
                >
                  <X />
                </Button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
