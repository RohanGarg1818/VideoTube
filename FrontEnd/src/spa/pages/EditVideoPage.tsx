import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VideoAPI } from "../services/endpoints";
import { useAsync } from "../hooks/useAsync";
import { apiErrorMessage } from "../services/api";
import { ErrorState } from "../components/EmptyState";
import { toast } from "sonner";

export function EditVideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useAsync(
    () => (videoId ? VideoAPI.get(videoId) : Promise.resolve(null)),
    [videoId],
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setTitle(data.title ?? "");
      setDescription(data.description ?? "");
    }
  }, [data]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <ErrorState message={errorMessage || "Something went wrong"} onRetry={refetch} />;
  if (!data || !videoId) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const form = new FormData();
      form.append("title", title);
      form.append("description", description);
      if (thumbnail) form.append("thumbnail", thumbnail);
      await VideoAPI.update(videoId, form);
      toast.success("Video updated");
      navigate(`/watch/${videoId}`);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    try {
      await VideoAPI.togglePublish(videoId);
      toast.success("Publish state toggled");
      refetch();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const remove = async () => {
    if (!confirm("Delete this video?")) return;
    try {
      await VideoAPI.remove(videoId);
      toast.success("Video deleted");
      navigate("/");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit video</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thumb">Replace thumbnail (optional)</Label>
            <Input id="thumb" type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
            <Button type="button" variant="secondary" onClick={togglePublish}>
              {data.isPublished ? "Unpublish" : "Publish"}
            </Button>
            <Button type="button" variant="destructive" onClick={remove} className="ml-auto">
              Delete
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}