import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VideoAPI } from "../services/endpoints";
import { apiErrorMessage } from "../services/api";
import { toast } from "sonner";

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_VIDEO_TYPES = ["video/mp4", "video/webm", "video/mpeg", "video/quicktime"];
const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function UploadPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const validateVideo = (file: File): string | null => {
    if (!VALID_VIDEO_TYPES.includes(file.type)) {
      return `Invalid video type. Supported formats: ${VALID_VIDEO_TYPES.join(", ")}`;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      return `Video file is too large. Maximum size is 500MB (your file is ${(file.size / 1024 / 1024).toFixed(2)}MB)`;
    }
    return null;
  };

  const validateThumbnail = (file: File): string | null => {
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      return "Invalid image type. Supported formats: JPEG, PNG, WebP";
    }
    if (file.size > MAX_THUMBNAIL_SIZE) {
      return `Thumbnail is too large. Maximum size is 10MB (your file is ${(file.size / 1024 / 1024).toFixed(2)}MB)`;
    }
    return null;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!videoFile) {
      toast.error("Video file is required");
      return;
    }
    if (!thumbnail) {
      toast.error("Thumbnail is required");
      return;
    }

    const videoError = validateVideo(videoFile);
    if (videoError) {
      toast.error(videoError);
      return;
    }

    const thumbnailError = validateThumbnail(thumbnail);
    if (thumbnailError) {
      toast.error(thumbnailError);
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("description", description.trim());
      form.append("videoFile", videoFile);
      form.append("thumbnail", thumbnail);

      console.log("Uploading video with FormData:", {
        title: title.trim(),
        description: description.trim(),
        videoFile: {
          name: videoFile.name,
          size: videoFile.size,
          type: videoFile.type,
        },
        thumbnail: {
          name: thumbnail.name,
          size: thumbnail.size,
          type: thumbnail.type,
        },
      });

      const video = await VideoAPI.publish(form);
      toast.success("Video uploaded successfully!");
      navigate(`/watch/${video._id}`);
    } catch (e) {
      const errorMsg = apiErrorMessage(e);
      console.error("Upload error:", errorMsg, e);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload a video</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Enter video description (optional)"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="video">Video file * (Max 500MB)</Label>
            <Input
              id="video"
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              disabled={loading}
            />
            {videoFile && (
              <p className="text-xs text-muted-foreground">
                Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="thumb">Thumbnail * (Max 10MB)</Label>
            <Input
              id="thumb"
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)}
              disabled={loading}
            />
            {thumbnail && (
              <p className="text-xs text-muted-foreground">
                Selected: {thumbnail.name} ({(thumbnail.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            )}
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Uploading…" : "Publish video"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}