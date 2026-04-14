"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Minimal self-contained Skeleton for shimmer loading states
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.4s_ease-in-out_infinite]",
        "after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
