"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Accordion Root ───────────────────────────────────────────────────────────

interface AccordionContextValue {
  openItems: string[];
  toggle: (value: string) => void;
  type: "single" | "multiple";
}

const AccordionContext = React.createContext<AccordionContextValue>({
  openItems: [],
  toggle: () => {},
  type: "single",
});

interface AccordionRootProps {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  className?: string;
  children: React.ReactNode;
  /**
   * Accepted for API parity with Radix Accordion. This implementation's
   * `type="single"` mode already allows collapsing the open item by clicking
   * it again, so the flag is accepted-but-implicit. Left optional so callers
   * that copy Radix patterns keep compiling.
   */
  collapsible?: boolean;
}

function Accordion({ type = "single", defaultValue, className, children }: AccordionRootProps) {
  const initial = defaultValue
    ? Array.isArray(defaultValue)
      ? defaultValue
      : [defaultValue]
    : [];

  const [openItems, setOpenItems] = React.useState<string[]>(initial);

  const toggle = React.useCallback(
    (value: string) => {
      if (type === "single") {
        setOpenItems((prev) => (prev.includes(value) ? [] : [value]));
      } else {
        setOpenItems((prev) =>
          prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
        );
      }
    },
    [type]
  );

  return (
    <AccordionContext.Provider value={{ openItems, toggle, type }}>
      <div data-slot="accordion" className={cn("space-y-1", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

// ─── Accordion Item ───────────────────────────────────────────────────────────

interface ItemContextValue {
  value: string;
  isOpen: boolean;
}
const ItemContext = React.createContext<ItemContextValue>({ value: "", isOpen: false });

interface AccordionItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

function AccordionItem({ value, className, children }: AccordionItemProps) {
  const { openItems } = React.useContext(AccordionContext);
  const isOpen = openItems.includes(value);

  return (
    <ItemContext.Provider value={{ value, isOpen }}>
      <div
        data-slot="accordion-item"
        data-state={isOpen ? "open" : "closed"}
        className={cn("rounded-xl border border-border/80 bg-card/60", className)}
      >
        {children}
      </div>
    </ItemContext.Provider>
  );
}

// ─── Accordion Trigger ────────────────────────────────────────────────────────

interface AccordionTriggerProps {
  className?: string;
  children: React.ReactNode;
}

function AccordionTrigger({ className, children }: AccordionTriggerProps) {
  const { toggle } = React.useContext(AccordionContext);
  const { value, isOpen } = React.useContext(ItemContext);

  return (
    <button
      data-slot="accordion-trigger"
      type="button"
      aria-expanded={isOpen}
      onClick={() => toggle(value)}
      className={cn(
        "flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-left",
        "rounded-xl transition-colors hover:bg-muted/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        className
      )}
    >
      <span>{children}</span>
      <ChevronDown
        className={cn(
          "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </button>
  );
}

// ─── Accordion Content ────────────────────────────────────────────────────────

interface AccordionContentProps {
  className?: string;
  children: React.ReactNode;
}

function AccordionContent({ className, children }: AccordionContentProps) {
  const { isOpen } = React.useContext(ItemContext);

  if (!isOpen) return null;

  return (
    <div
      data-slot="accordion-content"
      className={cn(
        "border-t border-border/60 px-4 pb-4 pt-3",
        "animate-in fade-in slide-in-from-top-1 duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
