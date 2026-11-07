import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  CloudUpload,
  FileVideo,
  Globe,
  Lock,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { VideoAPI } from "../services/endpoints";
import { apiErrorMessage } from "../services/api";
import { ImageDrop } from "../components/ImageDrop";
import { PageHeader } from "../components/PageHeader";
import { formatBytes, formatDuration } from "../lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024;
const VALID_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/mpeg",
  "video/quicktime",
  "video/x-matroska",
  "video/ogg",
];
const VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export function UploadPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!videoFile) return setVideoUrl(null);
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  const pickVideo = (f?: File | null) => {
    if (!f) return;
    if (!VALID_VIDEO_TYPES.includes(f.type))
      return toast.error(
        "Unsupported format. Use MP4, WebM, MOV, MKV or MPEG.",
      );
    if (f.size > MAX_VIDEO_SIZE)
      return toast.error(
        `Video is ${formatBytes(f.size)} — the limit is 500 MB.`,
      );
    setVideoFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
  };

  const pickThumb = (f: File | null) => {
    if (f && !VALID_IMAGE_TYPES.includes(f.type))
      return toast.error("Thumbnail must be JPEG, PNG, WebP, GIF or AVIF.");
    if (f && f.size > MAX_THUMBNAIL_SIZE)
      return toast.error("Thumbnail must be under 10 MB.");
    setThumbnail(f);
  };

  const uploading = progress !== null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");
    if (!videoFile) return toast.error("Choose a video file");
    if (!thumbnail) return toast.error("Choose a thumbnail");

    setProgress(0);
    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("description", description.trim());
      form.append("isPublished", String(isPublished));
      form.append("videoFile", videoFile);
      form.append("thumbnail", thumbnail);
      const video = await VideoAPI.publish(form, setProgress);
      toast.success(isPublished ? "Video published" : "Draft saved");
      navigate(`/watch/${video._id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setProgress(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        icon={CloudUpload}
        title="Upload video"
        subtitle="MP4, WebM, MOV or MKV · up to 500 MB"
      />

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {!videoFile ? (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                pickVideo(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center transition-colors hover:border-white/30 hover:bg-white/[0.04]",
                drag && "border-white/40 bg-white/[0.05]",
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                hidden
                onChange={(e) => pickVideo(e.target.files?.[0])}
              />
              <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-white/[0.06]">
                <CloudUpload
                  className="h-6 w-6 text-muted-foreground"
                  strokeWidth={1.75}
                />
              </div>
              <p className="text-[15px] font-medium">
                Drag and drop a video file
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                or click to browse
              </p>
            </div>
          ) : (
            <div className="surface overflow-hidden rounded-xl">
              {videoUrl && (
                <video
                  src={videoUrl}
                  controls
                  className="aspect-video w-full bg-black"
                  onLoadedMetadata={(e) =>
                    setDuration(e.currentTarget.duration)
                  }
                />
              )}
              <div className="flex items-center gap-3 p-4">
                <FileVideo className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {videoFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(videoFile.size)}{" "}
                    {duration ? `· ${formatDuration(duration)}` : ""}
                  </p>
                </div>
                {!uploading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setVideoFile(null)}
                    aria-label="Remove video"
                  >
                    <X />
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="surface space-y-5 rounded-xl p-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="title">Title *</Label>
                <span className="text-xs text-muted-foreground">
                  {title.length}/120
                </span>
              </div>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Give your video a catchy title"
                disabled={uploading}
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
                rows={6}
                maxLength={5000}
                placeholder="Tell viewers what your video is about"
                disabled={uploading}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface space-y-3 rounded-xl p-5">
            <Label>Thumbnail *</Label>
            <ImageDrop
              file={thumbnail}
              onChange={pickThumb}
              label="Upload thumbnail"
              hint="1280×720 recommended · max 10 MB"
              shape="video"
            />
          </div>

          <div className="surface rounded-xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {isPublished ? (
                  <Globe className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Lock className="h-5 w-5 text-amber-400" />
                )}
                <div>
                  <p className="text-sm font-semibold">
                    {isPublished ? "Public" : "Draft"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPublished ? "Everyone can watch" : "Only you can see it"}
                  </p>
                </div>
              </div>
              <Switch
                checked={isPublished}
                onCheckedChange={setIsPublished}
                disabled={uploading}
              />
            </div>
          </div>

          <div className="surface space-y-4 rounded-xl p-5">
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    {progress! < 100 ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    {progress! < 100 ? "Uploading…" : "Processing on server…"}
                  </span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <Progress value={progress!} />
              </div>
            )}
            <Button
              type="submit"
              size="lg"
              disabled={uploading || !videoFile || !thumbnail || !title.trim()}
              className="w-full"
            >
              {uploading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CloudUpload />
              )}
              {uploading
                ? "Publishing…"
                : isPublished
                  ? "Publish video"
                  : "Save draft"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
