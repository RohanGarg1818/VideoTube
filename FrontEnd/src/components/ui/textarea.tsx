import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "min-h-[60px] px-3 py-2 leading-relaxed flex w-full rounded-lg border border-white/10 bg-white/[0.03] text-sm transition-colors placeholder:text-muted-foreground/70 hover:border-white/15 focus-visible:border-brand/70 focus-visible:bg-white/[0.04] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
