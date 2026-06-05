import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { VideoAPI } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { ErrorState } from "../components/EmptyState";
import { apiErrorMessage } from "../services/api";
import { toast } from "sonner";
import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

export function EditVideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();

  const { data: video, loading, error, refetch } = useAsync(
    () => (videoId ? VideoAPI.get(videoId) : Promise.resolve(null)),
    [videoId]
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (video) {
      setTitle(video.title || "");
      setDescription(video.description || "");
    }
  }, [video]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading...
      </p>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "Something went wrong"
        }
        onRetry={refetch}
      />
    );
  }

  if (!video) return null;

  

  const handleSave = async () => {
    try {
      setSaving(true);

      const form = new FormData();

      form.append("title", title);
      form.append("description", description);

      if (thumbnail) {
        form.append("thumbnail", thumbnail);
      }

      await VideoAPI.update(video._id, form);

      toast.success("Video updated successfully");

      navigate(`/watch/${video._id}`);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      await VideoAPI.remove(video._id);

      toast.success("Video deleted successfully");

      navigate("/");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Edit Video
        </h1>

        <p className="text-sm text-muted-foreground">
          Update your video details
        </p>
      </div>

      {video.thumbnail && (
        <div className="overflow-hidden rounded-xl border">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full object-cover"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Title
        </label>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Description
        </label>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-border bg-background px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Change Thumbnail
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setThumbnail(e.target.files?.[0] || null)
          }
        />
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>

        <Button
          variant="destructive"
          disabled={deleting}
          onClick={handleDelete}
        >
          {deleting ? "Deleting..." : "Delete Video"}
        </Button>
      </div>
    </div>
  );
}