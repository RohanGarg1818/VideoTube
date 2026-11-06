import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Click / drag-and-drop image picker with live preview. */
export function ImageDrop({
  file,
  onChange,
  label,
  hint,
  shape = "wide",
  existingUrl,
  className,
}: {
  file: File | null;
  onChange: (f: File | null) => void;
  label: string;
  hint?: string;
  shape?: "wide" | "round" | "video";
  existingUrl?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = preview ?? existingUrl;
  const pick = (f?: File) => f && f.type.startsWith("image/") && onChange(f);

  return (
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
        pick(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "group relative grid cursor-pointer place-items-center overflow-hidden border-2 border-dashed border-white/15 bg-white/[0.03] text-center transition-all hover:border-fuchsia-400/50 hover:bg-white/[0.06]",
        drag && "border-fuchsia-400 bg-fuchsia-500/10",
        shape === "round" ? "h-28 w-28 rounded-full" : "rounded-2xl",
        shape === "wide" && "aspect-[4/1] w-full",
        shape === "video" && "aspect-video w-full",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => pick(e.target.files?.[0] ?? undefined)}
      />
      {shown ? (
        <>
          <img
            src={shown}
            alt={label}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="text-xs font-medium">Change</span>
          </div>
          {file && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 backdrop-blur hover:bg-black/80"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </>
      ) : (
        <div className="p-3">
          <ImagePlus className="mx-auto h-6 w-6 text-fuchsia-300" />
          <p className="mt-1.5 text-xs font-medium">{label}</p>
          {hint && shape !== "round" && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
          )}
        </div>
      )}
    </div>
  );
}
