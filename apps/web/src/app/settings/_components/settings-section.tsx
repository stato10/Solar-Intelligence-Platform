"use client";

/**
 * SettingsSection — shared shell used by every settings section
 * (doc 08 §4–§7).
 *
 * Provides:
 *   - A heading + description block
 *   - A content slot where per-section forms render
 *   - A footer with Save button + inline success/error chip
 *   - An impression event (`settings_section_view`) per doc 08 §9
 *
 * Persistence policy: sections pass their own `onSave` async callback.
 * Optimistic UI is handled here: the button disables during the call;
 * on success we flash a "Saved" chip that auto-dismisses after 3s.
 */

import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { track } from "@/lib/analytics/client";

export interface SettingsSectionProps {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
  /** Fires when the user clicks "Save changes". Resolve for success,
   *  reject with an Error to render an inline error. Returning `false`
   *  is treated as a no-op (e.g. nothing changed, or client-side
   *  validation failed silently). */
  onSave?: () => Promise<void | boolean>;
  /** Hides the Save button — useful for sections that persist
   *  per-control on change (e.g. integrations list). */
  hideSave?: boolean;
  /** Disables the Save button regardless of state. */
  saveDisabled?: boolean;
  /** Optional banner rendered above the form (e.g. the no-data banner
   *  for System configuration per doc 08 §8). */
  banner?: ReactNode;
}

export function SettingsSection({
  id,
  title,
  description,
  children,
  onSave,
  hideSave,
  saveDisabled,
  banner,
}: SettingsSectionProps) {
  const headingId = useId();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Impression event per doc 08 §9.
  useEffect(() => {
    track("settings_section_view", { section: id }, { surface: "settings" });
  }, [id]);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(false), 3000);
    return () => window.clearTimeout(t);
  }, [success]);

  const handleSave = useCallback(async () => {
    if (!onSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = await onSave();
      if (result === false) {
        setSaving(false);
        return;
      }
      setSuccess(true);
      track("settings_save_success", { section: id }, { surface: "settings" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setError(message);
      track(
        "settings_save_error",
        { section: id, errorCode: message },
        { surface: "settings" },
      );
    } finally {
      setSaving(false);
    }
  }, [id, onSave, saving]);

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      data-section-id={id}
      className="glass-card rounded-2xl p-5 md:p-6 scroll-mt-20"
    >
      <header className="mb-4">
        <h2 id={headingId} className="text-base md:text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-1 text-xs md:text-sm text-muted-foreground">
          {description}
        </p>
      </header>

      {banner ? <div className="mb-4">{banner}</div> : null}

      <div className="divide-y divide-border/40">{children}</div>

      {!hideSave ? (
        <footer className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/40 pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saveDisabled || !onSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {success ? (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-500"
            >
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Saved
            </span>
          ) : null}
          {error ? (
            <span
              role="alert"
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-500"
            >
              <AlertCircle className="h-3 w-3" aria-hidden />
              {error}
            </span>
          ) : null}
        </footer>
      ) : null}
    </section>
  );
}
