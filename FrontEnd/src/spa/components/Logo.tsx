import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/** Film-leader inspired mark: an orange frame with a notched play glyph. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} aria-hidden>
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="9"
        fill="var(--color-brand)"
      />
      <path
        d="M12.5 10.2v11.6c0 .8.9 1.3 1.6.8l8.6-5.8a1 1 0 0 0 0-1.6l-8.6-5.8c-.7-.5-1.6 0-1.6.8z"
        fill="oklch(0.16 0.02 45)"
      />
    </svg>
  );
}

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      to="/"
      className={cn("group flex items-center gap-2", className)}
      aria-label="VideoTube home"
    >
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6" />
      {!compact && (
        <span className="text-[19px] font-semibold tracking-[-0.03em]">
          Video
          <span className="display text-[23px] italic text-brand">tube</span>
        </span>
      )}
    </Link>
  );
}
