import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "h-9 px-3 py-1 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground flex w-full rounded-lg border border-white/10 bg-white/[0.03] text-sm transition-colors placeholder:text-muted-foreground/70 hover:border-white/15 focus-visible:border-white/30 focus-visible:bg-white/[0.04] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
