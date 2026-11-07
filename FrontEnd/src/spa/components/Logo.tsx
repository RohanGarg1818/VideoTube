import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" className={cn("h-5 w-7", className)} aria-hidden>
      <rect width="28" height="20" rx="5" fill="var(--color-brand)" />
      <path d="M11.5 6.2v7.6L18 10z" fill="#fff" />
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
      className={cn(
        "flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]",
        className,
      )}
      aria-label="VideoTube home"
    >
      <LogoMark />
      {!compact && <span>VideoTube</span>}
    </Link>
  );
}
