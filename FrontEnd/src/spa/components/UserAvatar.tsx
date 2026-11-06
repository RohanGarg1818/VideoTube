import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initials } from "../lib/format";

export function UserAvatar({
  src,
  name,
  className,
  ring = false,
}: {
  src?: string;
  name?: string;
  className?: string;
  ring?: boolean;
}) {
  return (
    <Avatar
      className={cn(
        "h-9 w-9",
        ring && "ring-2 ring-white/15 ring-offset-2 ring-offset-transparent",
        className,
      )}
    >
      <AvatarImage src={src} alt={name} className="object-cover" />
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
