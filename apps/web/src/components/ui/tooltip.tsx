"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Tooltip Context ──────────────────────────────────────────────────────────

interface TooltipContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextValue>({
  open: false,
  setOpen: () => {},
});

// ─── Tooltip Provider (noop wrapper for compat) ───────────────────────────────

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ─── Tooltip Root ─────────────────────────────────────────────────────────────

function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-flex">{children}</div>
    </TooltipContext.Provider>
  );
}

// ─── Tooltip Trigger ──────────────────────────────────────────────────────────

function TooltipTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { setOpen } = React.useContext(TooltipContext);
  const child = React.Children.only(children) as React.ReactElement<Record<string, unknown>>;

  if (asChild && React.isValidElement(child)) {
    return React.cloneElement(child, {
      onMouseEnter: () => setOpen(true),
      onMouseLeave: () => setOpen(false),
      onFocus: () => setOpen(true),
      onBlur: () => setOpen(false),
    });
  }

  return (
    <span
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      className="inline-flex"
    >
      {children}
    </span>
  );
}

// ─── Tooltip Content ──────────────────────────────────────────────────────────

interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}

function TooltipContent({ children, className, side = "top" }: TooltipContentProps) {
  const { open } = React.useContext(TooltipContext);

  if (!open) return null;

  const sideClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      role="tooltip"
      className={cn(
        "absolute z-50 w-max max-w-xs rounded-lg border border-border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md",
        "animate-in fade-in zoom-in-95 duration-150",
        sideClasses[side],
        className
      )}
    >
      {children}
    </div>
  );
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
