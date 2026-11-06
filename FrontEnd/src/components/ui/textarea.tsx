import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-base shadow-sm transition-all hover:border-white/20 focus-visible:border-violet-400/60 focus-visible:bg-white/[0.07] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/15 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
