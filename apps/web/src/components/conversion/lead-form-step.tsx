"use client";

/**
 * Step 4 of the conversion flow — lead form.
 * Spec: docs/redesign/15-conversion-flow.md §5.
 *
 * Minimum-viable field set:
 *   - Name (required)
 *   - Phone (required, simple format check)
 *   - Email (optional when phone present; otherwise required)
 *   - Preferred window (book) or note (quote / configure)
 *   - Consent checkbox (required)
 *
 * Validation is inline per field; the submit button stays enabled
 * so the user always sees the validation message rather than a
 * blocked-looking interaction (progressive disclosure of errors).
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useConversionFlowState } from "@/hooks/use-conversion-flow";

interface FormState {
  name: string;
  phone: string;
  email: string;
  preferredWindow: string;
  note: string;
  consent: boolean;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const PHONE_RE = /^[0-9+()\-\s]{7,}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function LeadFormStep() {
  const { context, submitLead, isSubmitting, submitError, close } =
    useConversionFlowState();

  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    preferredWindow: "",
    note: "",
    consent: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  if (!context) return null;

  const wantsWindow = context.ctaKind === "book";
  const wantsNote =
    context.ctaKind === "quote" || context.ctaKind === "configure";

  function setField<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!form.name.trim()) e.name = "Please enter your name.";
    if (!form.phone.trim() && !form.email.trim()) {
      e.phone = "Enter a phone or email we can reach you at.";
    } else if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) {
      e.phone = "That phone format looks off.";
    }
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) {
      e.email = "That email format looks off.";
    }
    if (!form.consent) {
      e.consent =
        "We need your consent before sharing any details with a provider.";
    }
    return e;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    await submitLead({
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      preferredWindow: wantsWindow ? form.preferredWindow.trim() || undefined : undefined,
      note: wantsNote ? form.note.trim() || undefined : undefined,
      consent: form.consent,
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {/* Name */}
      <Field
        id="lead-name"
        label="Full name"
        required
        error={errors.name}
      >
        <Input
          id="lead-name"
          autoComplete="name"
          value={form.name}
          onChange={(ev) => setField("name", ev.target.value)}
          disabled={isSubmitting}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="lead-phone"
          label="Phone"
          required
          helperText="Format: +972 50 123 4567"
          error={errors.phone}
        >
          <Input
            id="lead-phone"
            autoComplete="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(ev) => setField("phone", ev.target.value)}
            disabled={isSubmitting}
          />
        </Field>
        <Field id="lead-email" label="Email" error={errors.email}>
          <Input
            id="lead-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(ev) => setField("email", ev.target.value)}
            disabled={isSubmitting}
          />
        </Field>
      </div>

      {wantsWindow ? (
        <Field
          id="lead-window"
          label="Preferred time window"
          helperText="Example: weekday mornings, Tuesday after 16:00."
        >
          <Input
            id="lead-window"
            value={form.preferredWindow}
            onChange={(ev) => setField("preferredWindow", ev.target.value)}
            disabled={isSubmitting}
          />
        </Field>
      ) : null}

      {wantsNote ? (
        <Field
          id="lead-note"
          label="Anything we should flag to the provider?"
          helperText="Optional — dimensions, access notes, known constraints."
        >
          <textarea
            id="lead-note"
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={form.note}
            onChange={(ev) => setField("note", ev.target.value)}
            disabled={isSubmitting}
          />
        </Field>
      ) : null}

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-border"
          checked={form.consent}
          onChange={(ev) => setField("consent", ev.target.checked)}
          disabled={isSubmitting}
        />
        <span className="text-foreground/90">
          I agree to share my system summary with the selected provider.
        </span>
      </label>
      {errors.consent ? (
        <p className="text-xs text-rose-500">{errors.consent}</p>
      ) : null}

      {submitError ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-500"
        >
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => close("cancel")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Sending…
            </>
          ) : (
            "Send request"
          )}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Small field wrapper
// ---------------------------------------------------------------------------
function Field({
  id,
  label,
  required,
  helperText,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className={cn(error && "text-rose-500")}>
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-rose-500">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}
