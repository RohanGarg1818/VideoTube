import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  Globe,
  Heart,
  Lock,
  Pencil,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { VideoAPI, type Video } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { ErrorState } from "../components/EmptyState";
import { ImageDrop } from "../components/ImageDrop";
import { PageHeader } from "../components/PageHeader";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { apiErrorMessage } from "../services/api";
import { formatCount, getOwner, timeAgo } from "../lib/format";
import { useAuthStore } from "../store/authStore";
import { toast } from "sonner";

export function EditVideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const {
    data: video,
    loading,
    errorMessage,
    refetch,
    setData,
  } = useAsync<Video | null>(
    () => (videoId ? VideoAPI.get(videoId) : Promise.resolve(null)),
    [videoId],
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (video) {
      setTitle(video.title || "");
      setDescription(video.description || "");
    }
  }, [video]);

  if (loading)
    return <div className="skeleton mx-auto h-96 max-w-5xl rounded-xl" />;
  if (errorMessage)
    return <ErrorState message={errorMessage} onRetry={refetch} />;
  if (!video) return null;
  if (getOwner(video)?._id !== me?._id)
    return <ErrorState message="You can only edit your own videos." />;

  const dirty =
    title !== video.title ||
    description !== (video.description ?? "") ||
    thumbnail !== null;

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Title cannot be empty");
    setSaving(true);
    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("description", description.trim());
      if (thumbnail) form.append("thumbnail", thumbnail);
      const updated = await VideoAPI.update(video._id, form);
      setData({ ...video, ...updated });
      setThumbnail(null);
      toast.success("Changes saved");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    try {
      const updated = await VideoAPI.togglePublish(video._id);
      setData({ ...video, isPublished: updated.isPublished });
      toast.success(
        updated.isPublished ? "Video is now public" : "Video is now a draft",
      );
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft /> Back
      </Button>
      <PageHeader
        icon={Pencil}
        title="Edit video"
        subtitle={`Uploaded ${timeAgo(video.createdAt)}`}
        actions={
          <Button variant="outline" asChild>
            <Link to={`/watch/${video._id}`}>
              <Eye /> View on watch page
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="surface space-y-5 rounded-xl p-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="title">Title</Label>
              <span className="text-xs text-muted-foreground">
                {title.length}/120
              </span>
            </div>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="desc">Description</Label>
              <span className="text-xs text-muted-foreground">
                {description.length}/5000
              </span>
            </div>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={10}
              maxLength={5000}
            />
          </div>
          <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
            <Button onClick={handleSave} disabled={saving || !dirty}>
              <Save /> {saving ? "Saving…" : "Save changes"}
            </Button>
            <ConfirmDialog
              title="Delete this video?"
              description="The video, its comments, likes and views will be permanently removed. This can't be undone."
              confirmLabel="Delete forever"
              onConfirm={async () => {
                try {
                  await VideoAPI.remove(video._id);
                  toast.success("Video deleted");
                  navigate("/studio");
                } catch (e) {
                  toast.error(apiErrorMessage(e));
                }
              }}
              trigger={
                <Button variant="destructive" className="ml-auto">
                  <Trash2 /> Delete video
                </Button>
              }
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface space-y-3 rounded-xl p-5">
            <Label>Thumbnail</Label>
            <ImageDrop
              file={thumbnail}
              onChange={setThumbnail}
              existingUrl={video.thumbnail}
              label="Change thumbnail"
              shape="video"
            />
          </div>
          <div className="surface rounded-xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {video.isPublished ? (
                  <Globe className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Lock className="h-5 w-5 text-amber-400" />
                )}
                <div>
                  <p className="text-sm font-semibold">
                    {video.isPublished ? "Public" : "Draft"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {video.isPublished
                      ? "Visible to everyone"
                      : "Only visible to you"}
                  </p>
                </div>
              </div>
              <Switch
                checked={Boolean(video.isPublished)}
                onCheckedChange={togglePublish}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 text-center">
              <div className="rounded-xl bg-white/5 p-2">
                <Eye className="mx-auto h-4 w-4 text-muted-foreground" />
                <p className="mt-1 font-bold">{formatCount(video.views)}</p>
                <p className="text-[11px] text-muted-foreground">views</p>
              </div>
              <div className="rounded-xl bg-white/5 p-2">
                <Heart className="mx-auto h-4 w-4 text-foreground" />
                <p className="mt-1 font-bold">{formatCount(video.likes)}</p>
                <p className="text-[11px] text-muted-foreground">likes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
