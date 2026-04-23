"use client";

/**
 * FormRow — canonical form primitive for the Settings control center
 * (doc 08 §6). One row = label + control + helper + validation.
 *
 * The primitive accepts any control as `children` so we stay flexible
 * for selects, switches, multi-selects, etc.
 */

import type { ReactNode } from "react";

export interface FormRowProps {
  label: string;
  htmlFor?: string;
  helper?: string;
  error?: string | null;
  /** Optional right-aligned hint (e.g. units like "kWp"). */
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormRow({ label, htmlFor, helper, error, hint, required, children }: FormRowProps) {
  return (
    <div className="grid gap-1.5 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] md:gap-4 md:items-start py-3 border-b border-border/40 last:border-b-0">
      <div>
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-foreground"
        >
          {label}
          {required ? <span className="text-rose-500"> *</span> : null}
        </label>
        {helper ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>
        ) : null}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">{children}</div>
          {hint ? (
            <span className="shrink-0 text-xs text-muted-foreground">{hint}</span>
          ) : null}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-rose-500">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormGroup — a labelled cluster of FormRows. Used inside long settings
// sections (e.g. System configuration) so the reader can mentally chunk
// related controls (Location / Panels / Orientation) at a glance.
// ---------------------------------------------------------------------------
export interface FormGroupProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormGroup({ title, description, children }: FormGroupProps) {
  return (
    <div className="pt-4 first:pt-0">
      <div className="flex items-baseline justify-between border-b border-border/40 pb-1.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h3>
        {description ? (
          <p className="hidden text-[11px] text-muted-foreground/80 md:block">{description}</p>
        ) : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared control primitives — consistent visual, matches our dark SaaS
// tokens. Kept deliberately small; add variants as sections demand.
// ---------------------------------------------------------------------------
const INPUT_CLASS =
  "w-full rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm shadow-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-60";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${INPUT_CLASS} ${props.className ?? ""}`} />;
}

export function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      inputMode="decimal"
      {...props}
      className={`${INPUT_CLASS} tabular-nums ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`${INPUT_CLASS} appearance-none bg-background ${props.className ?? ""}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Toggle — small, accessible switch. Visual is a compact pill so each row
// stays dense but still clearly interactive.
// ---------------------------------------------------------------------------
export interface ToggleProps {
  id?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ id, checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 text-sm ${disabled ? "opacity-60" : "cursor-pointer"}`}
    >
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-background shadow transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-[2px]"
          }`}
        />
      </span>
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
}
