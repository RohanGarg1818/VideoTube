import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

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
        "group flex items-center gap-2.5 font-extrabold tracking-tight",
        className,
      )}
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-500/30 transition-transform group-hover:scale-105">
        <Play className="h-4 w-4 translate-x-[1px] fill-white text-white" />
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/30" />
      </span>
      {!compact && (
        <span className="text-lg">
          Video<span className="text-gradient">Tube</span>
        </span>
      )}
    </Link>
  );
}
