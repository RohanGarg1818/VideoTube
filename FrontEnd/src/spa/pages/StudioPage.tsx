import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Eye,
  Film,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Pencil,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DashboardAPI, VideoAPI, type Video } from "../services/endpoints";
import { useAsync, usePaginated } from "../hooks/useAsync";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { PageHeader, SectionHeading } from "../components/PageHeader";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LoadMore } from "../components/LoadMore";
import { VideoThumb } from "../components/VideoCard";
import { apiErrorMessage } from "../services/api";
import { formatCount, formatDate, formatLongDuration } from "../lib/format";
import { useAuthStore } from "../store/authStore";
import { toast } from "sonner";

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
  hint?: string;
  tint?: string;
}) {
  return (
    <div className="surface group relative overflow-hidden rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-[10px]">{label}</span>
        <Icon
          className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-brand"
          strokeWidth={1.5}
        />
      </div>
      <p className="display mt-4 text-[52px] tabular-nums">
        {formatCount(value)}
      </p>
      <p className="mt-2 h-4 font-mono text-[11px] text-brand">{hint}</p>
    </div>
  );
}

export function StudioPage() {
  const me = useAuthStore((s) => s.user)!;
  const stats = useAsync(() => DashboardAPI.stats(), []);
  const videos = usePaginated(
    (page) => DashboardAPI.videos({ page, limit: 10 }),
    [],
  );

  const s = stats.data;

  const updateVideo = (v: Partial<Video> & { _id: string }) =>
    videos.setItems((prev) =>
      prev.map((x) => (x._id === v._id ? { ...x, ...v } : x)),
    );

  const togglePublish = async (v: Video) => {
    updateVideo({ _id: v._id, isPublished: !v.isPublished });
    try {
      const res = await VideoAPI.togglePublish(v._id);
      updateVideo({ _id: v._id, isPublished: res.isPublished });
      stats.refetch();
    } catch (e) {
      updateVideo({ _id: v._id, isPublished: v.isPublished });
      toast.error(apiErrorMessage(e));
    }
  };

  const remove = async (v: Video) => {
    try {
      await VideoAPI.remove(v._id);
      videos.setItems((prev) => prev.filter((x) => x._id !== v._id));
      videos.setTotal((t) => t - 1);
      stats.refetch();
      toast.success("Video deleted");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        eyebrow={`Studio · @${me.username}`}
        title="Your channel at a glance"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to={`/channel/${me.username}`}>View channel</Link>
            </Button>
            <Button asChild>
              <Link to="/upload">
                <Upload /> Upload
              </Link>
            </Button>
          </>
        }
      />

      {stats.errorMessage ? (
        <ErrorState message={stats.errorMessage} onRetry={stats.refetch} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.loading || !s ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-36 rounded-xl" />
              ))
            ) : (
              <>
                <StatCard
                  icon={Eye}
                  label="Total views"
                  value={s.totalViews}
                  tint="bg-violet-500"
                />
                <StatCard
                  icon={Users}
                  label="Subscribers"
                  value={s.subscribersCount}
                  tint="bg-fuchsia-500"
                  hint={`+${s.newSubscribersLast30Days} in the last 30 days`}
                />
                <StatCard
                  icon={Heart}
                  label="Likes"
                  value={s.totalLikes}
                  tint="bg-pink-500"
                />
                <StatCard
                  icon={MessageSquare}
                  label="Comments"
                  value={s.totalComments}
                  tint="bg-cyan-500"
                />
              </>
            )}
          </div>

          {s && (
            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
              <div className="surface rounded-2xl p-5">
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="display text-[26px]">Views by month</h2>
                  <span className="text-xs text-muted-foreground">
                    {s.publishedVideos} published · {s.draftVideos} drafts ·{" "}
                    {formatLongDuration(s.totalDuration)} of content
                  </span>
                </div>
                {s.uploadsByMonth.length ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={s.uploadsByMonth}
                        margin={{ left: -10, right: 10, top: 10 }}
                      >
                        <defs>
                          <linearGradient
                            id="viewsFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#ff6a2b"
                              stopOpacity={0.28}
                            />
                            <stop
                              offset="100%"
                              stopColor="#ff6a2b"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          stroke="rgba(255,255,255,0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="month"
                          stroke="rgba(255,255,255,0.4)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="rgba(255,255,255,0.4)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#211d19",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="views"
                          stroke="#ff6a2b"
                          strokeWidth={2}
                          fill="url(#viewsFill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    Upload your first video to see analytics.
                  </p>
                )}
              </div>

              <div className="surface rounded-2xl p-5">
                <h2 className="display mb-4 text-[26px]">Top videos</h2>
                {s.topVideos.length ? (
                  <ol className="space-y-2">
                    {s.topVideos.map((v, i) => (
                      <li key={v._id}>
                        <Link
                          to={`/watch/${v._id}`}
                          className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-white/5"
                        >
                          <span className="display w-6 text-[26px] italic text-brand">
                            {i + 1}
                          </span>
                          <img
                            src={v.thumbnail}
                            alt=""
                            className="aspect-video w-20 rounded-lg object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {v.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatCount(v.views)} views ·{" "}
                              {formatCount(v.likes)} likes
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No videos yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-14">
        <SectionHeading
          index="02"
          title="Your content"
          right={<span className="eyebrow">{videos.total} videos</span>}
        />
      </div>
      {videos.loading ? (
        <div className="skeleton h-64 rounded-xl" />
      ) : videos.errorMessage ? (
        <ErrorState message={videos.errorMessage} onRetry={videos.reload} />
      ) : !videos.items.length ? (
        <EmptyState
          icon={Film}
          title="No videos yet"
          description="Upload your first video and it'll show up here."
          action={
            <Button asChild>
              <Link to="/upload">
                <Upload /> Upload video
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="surface overflow-x-auto rounded-xl">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                <th className="p-4 font-medium">Video</th>
                <th className="p-4 font-medium">Visibility</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 text-right font-medium">Views</th>
                <th className="p-4 text-right font-medium">Likes</th>
                <th className="p-4 text-right font-medium">Comments</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {videos.items.map((v) => (
                <tr
                  key={v._id}
                  className="group border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="p-3">
                    <Link
                      to={`/watch/${v._id}`}
                      className="flex items-center gap-3"
                    >
                      <VideoThumb
                        video={{ ...v, isPublished: true }}
                        className="w-28 shrink-0 rounded-xl"
                      />
                      <span className="line-clamp-2 max-w-xs font-medium">
                        {v.title}
                      </span>
                    </Link>
                  </td>
                  <td className="p-4">
                    <label className="flex items-center gap-2">
                      <Switch
                        checked={Boolean(v.isPublished)}
                        onCheckedChange={() => togglePublish(v)}
                      />
                      <span
                        className={
                          v.isPublished ? "text-emerald-400" : "text-amber-400"
                        }
                      >
                        {v.isPublished ? "Public" : "Draft"}
                      </span>
                    </label>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {formatDate(v.createdAt)}
                  </td>
                  <td className="p-4 text-right font-mono text-[13px] tabular-nums">
                    {formatCount(v.views)}
                  </td>
                  <td className="p-4 text-right font-mono text-[13px] tabular-nums">
                    {formatCount(v.likes)}
                  </td>
                  <td className="p-4 text-right font-mono text-[13px] tabular-nums">
                    {formatCount(v.commentsCount ?? 0)}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        aria-label="Edit"
                      >
                        <Link to={`/video/edit/${v._id}`}>
                          <Pencil />
                        </Link>
                      </Button>
                      <ConfirmDialog
                        title="Delete this video?"
                        description={`"${v.title}" and all its comments and likes will be removed.`}
                        onConfirm={() => remove(v)}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-400"
                            aria-label="Delete"
                          >
                            <Trash2 />
                          </Button>
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <LoadMore
            hasMore={videos.hasMore}
            loading={videos.loadingMore}
            onLoadMore={videos.loadMore}
          />
        </div>
      )}
    </div>
  );
}
