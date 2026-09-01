"use client";

/**
 * useConversionFlow — the single hook every CTA in the product uses.
 * Spec: docs/redesign/15-conversion-flow.md (5-step flow), emits the
 * events in docs/redesign/17-monetization.md §3.1.
 *
 * Architecture
 *   - A `ConversionFlowProvider` lives at the root layout level (see
 *     app/layout.tsx). It owns the single modal instance, the step
 *     state, and the submission lifecycle.
 *   - Callers invoke `const { start } = useConversionFlow()` and call
 *     `start(context)` from their CTA's onClick handler.
 *   - The provider routes between ContextStep → ProviderPicker →
 *     LeadForm → Confirmation based on the `ctaKind` passed in the
 *     context. Each step component is presentation-only and talks back
 *     via the callbacks the provider injects through context.
 *
 * This file exports:
 *   - `ConversionFlowProvider` — wrap once at the root.
 *   - `useConversionFlow()` — returns `{ start, close }`.
 *   - `useConversionFlowState()` — internal, only used by the modal.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { track } from "@/lib/analytics/client";
import type {
  CatalogCtaKind,
  ProviderItem,
  RecommendationType,
} from "@/data/marketplace/types";
import { createLeadIntent } from "@/lib/api/marketplace";
import type { LeadSourceType } from "@/lib/contracts/marketplace";
import { ConversionModal } from "@/components/conversion/ConversionModal";

// ---------------------------------------------------------------------------
// Public types (doc 15 §2 ConversionContext, §5 LeadPayload)
// ---------------------------------------------------------------------------
export type ConversionSourceSurface =
  | "dashboard_hero"
  | "dashboard_now"
  | "dashboard_recommended"
  | "dashboard_explore"
  | "maintenance_concern"
  | "savings_lane"
  | "automation_device"
  | "opportunities_section";

export interface ConversionContext {
  sourceSurface: ConversionSourceSurface;
  recommendationType: RecommendationType;
  catalogItemId?: string;
  catalogItemTitle?: string;
  catalogItemBrand?: string;
  deviceTarget?: "boiler" | "dishwasher" | "ev-charger" | "smart-switch";
  monthlyGainNis?: number;
  yearlyGainNis?: number;
  priceRange?: string;
  confidence: "high" | "medium" | "low";
  priority: "high" | "medium" | "low";
  ctaKind: CatalogCtaKind;
  siteId?: string;
  accessToken?: string;
}

export type ConversionStep =
  | "idle"
  | "context"
  | "provider"
  | "form"
  | "confirmation";

export interface LeadContact {
  name: string;
  phone?: string;
  email?: string;
  preferredWindow?: string;
  note?: string;
  consent: boolean;
}

// ---------------------------------------------------------------------------
// Context shape used by step components
// ---------------------------------------------------------------------------
export interface ConversionFlowStateApi {
  step: ConversionStep;
  context: ConversionContext | null;
  selectedProvider: ProviderItem | null;
  providers: ProviderItem[];
  isSubmitting: boolean;
  submitError: string | null;

  // Navigation
  advanceFromContext: () => void;
  selectProvider: (provider: ProviderItem | null) => void;
  submitLead: (contact: LeadContact) => Promise<void>;
  finish: () => void;
  close: (reason?: "close" | "cancel") => void;
}

interface ConversionFlowApi {
  start: (context: ConversionContext) => void;
  close: () => void;
}

const StartContext = createContext<ConversionFlowApi | null>(null);
const StateContext = createContext<ConversionFlowStateApi | null>(null);

// ---------------------------------------------------------------------------
// Public hook — for CTA callers.
// ---------------------------------------------------------------------------
export function useConversionFlow(): ConversionFlowApi {
  const ctx = useContext(StartContext);
  if (!ctx) {
    // Fail soft: callers should still render but their CTA becomes a no-op.
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[conversion-flow] useConversionFlow called outside a <ConversionFlowProvider>. The CTA will be a no-op.",
      );
    }
    return { start: () => {}, close: () => {} };
  }
  return ctx;
}

/** Internal — consumed by the modal and step components only. */
export function useConversionFlowState(): ConversionFlowStateApi {
  const ctx = useContext(StateContext);
  if (!ctx) {
    throw new Error(
      "useConversionFlowState must be called inside <ConversionFlowProvider>",
    );
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Lead payload mapping (doc 15 §5 → legacy CreateLeadIntentPayload)
// ---------------------------------------------------------------------------
function toLeadSourceType(rec: RecommendationType): LeadSourceType {
  switch (rec) {
    case "soiling":
      return "cleaning_recommendation";
    case "battery_opportunity":
      return "battery_recommendation";
    case "ev_opportunity":
      return "ev_recommendation";
    case "low_self_consumption":
    case "automation_opportunity":
    default:
      return "automation_recommendation";
  }
}

// ---------------------------------------------------------------------------
// Provider lookup — fed by the catalog.
// ---------------------------------------------------------------------------
import { loadCatalog, matchesServiceArea } from "@/lib/view-models/marketplace-catalog";

/** User's service area, persisted by onboarding in the `sip.serviceArea`
 *  cookie. Undefined (no cookie / SSR) means "don't restrict". */
function readServiceAreaCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("sip.serviceArea="));
  const value = match?.split("=").slice(1).join("=");
  return value ? decodeURIComponent(value) : undefined;
}

function selectProviders(
  context: ConversionContext,
): ProviderItem[] {
  if (context.ctaKind === "external" || context.ctaKind === "configure") {
    return []; // these flows skip provider selection
  }
  const catalog = loadCatalog();
  const serviceArea = readServiceAreaCookie();
  return catalog.providers.filter(
    (p) =>
      p.appliesTo.includes(context.recommendationType) &&
      matchesServiceArea(p, serviceArea),
  );
}

// ---------------------------------------------------------------------------
// Provider component
// ---------------------------------------------------------------------------
export function ConversionFlowProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [step, setStep] = useState<ConversionStep>("idle");
  const [context, setContext] = useState<ConversionContext | null>(null);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [selectedProvider, setSelectedProviderState] =
    useState<ProviderItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const lastStepReachedRef = useRef<"context" | "provider" | "form">("context");

  // ---- lifecycle ---------------------------------------------------
  const start = useCallback((ctx: ConversionContext) => {
    setContext(ctx);
    setProviders(selectProviders(ctx));
    setSelectedProviderState(null);
    setSubmitError(null);
    setIsSubmitting(false);
    setStep("context");
    lastStepReachedRef.current = "context";
    track(
      "cta_click",
      {
        recommendationType: ctx.recommendationType,
        confidence: ctx.confidence,
        priority: ctx.priority,
        monthlyGainNis: ctx.monthlyGainNis,
        catalogItemId: ctx.catalogItemId,
        ctaKind: ctx.ctaKind,
        sourceSurface: ctx.sourceSurface,
      },
      { surface: ctx.sourceSurface, siteId: ctx.siteId },
    );
    track(
      "modal_open",
      {
        recommendationType: ctx.recommendationType,
        catalogItemId: ctx.catalogItemId,
        sourceSurface: ctx.sourceSurface,
      },
      { surface: ctx.sourceSurface, siteId: ctx.siteId },
    );
  }, []);

  const close = useCallback(
    (reason: "close" | "cancel" = "close") => {
      if (context) {
        track(
          "modal_dismiss",
          {
            stepReached: lastStepReachedRef.current,
            reason,
          },
          { surface: context.sourceSurface, siteId: context.siteId },
        );
      }
      setStep("idle");
      setContext(null);
      setProviders([]);
      setSelectedProviderState(null);
      setSubmitError(null);
      setIsSubmitting(false);
    },
    [context],
  );

  // ---- navigation --------------------------------------------------
  const advanceFromContext = useCallback(() => {
    if (!context) return;
    // Configure / external skip provider selection.
    if (context.ctaKind === "configure" || context.ctaKind === "external") {
      setStep("form");
      lastStepReachedRef.current = "form";
      return;
    }
    setStep("provider");
    lastStepReachedRef.current = "provider";
  }, [context]);

  const selectProvider = useCallback(
    (provider: ProviderItem | null) => {
      setSelectedProviderState(provider);
      if (provider && context) {
        track(
          "provider_selected",
          {
            providerId: provider.providerId,
            recommendationType: context.recommendationType,
            catalogItemId: context.catalogItemId,
          },
          { surface: context.sourceSurface, siteId: context.siteId },
        );
      }
      setStep("form");
      lastStepReachedRef.current = "form";
    },
    [context],
  );

  const submitLead = useCallback(
    async (contact: LeadContact) => {
      if (!context) return;
      setIsSubmitting(true);
      setSubmitError(null);
      track(
        "lead_submit_attempt",
        {
          providerId: selectedProvider?.providerId ?? "any",
          recommendationType: context.recommendationType,
          hasEmail: Boolean(contact.email),
          hasPhone: Boolean(contact.phone),
        },
        { surface: context.sourceSurface, siteId: context.siteId },
      );
      try {
        // Map the doc-15 LeadPayload to the legacy CreateLeadIntentPayload.
        // Everything the server has no column for goes into metadataJson.
        await createLeadIntent(
          {
            siteId: context.siteId ?? "unknown",
            sourceType: toLeadSourceType(context.recommendationType),
            sourceReference: context.catalogItemId,
            title: context.catalogItemTitle
              ? `${context.ctaKind === "book" ? "Booking" : "Quote"} request — ${context.catalogItemTitle}`
              : `Lead — ${context.recommendationType}`,
            estimatedValue:
              context.monthlyGainNis ?? context.yearlyGainNis,
            metadataJson: {
              conversionContext: {
                sourceSurface: context.sourceSurface,
                recommendationType: context.recommendationType,
                catalogItemId: context.catalogItemId,
                catalogItemTitle: context.catalogItemTitle,
                catalogItemBrand: context.catalogItemBrand,
                deviceTarget: context.deviceTarget,
                confidence: context.confidence,
                priority: context.priority,
                ctaKind: context.ctaKind,
                priceRange: context.priceRange,
              },
              providerId: selectedProvider?.providerId ?? "any",
              providerName: selectedProvider?.title,
              contact: {
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
                preferredWindow: contact.preferredWindow,
                note: contact.note,
              },
              consent: { acceptedAt: new Date().toISOString() },
            },
          },
          context.accessToken,
        );
        track(
          "lead_submitted",
          {
            providerId: selectedProvider?.providerId ?? "any",
            recommendationType: context.recommendationType,
            catalogItemId: context.catalogItemId,
            monthlyGainNis: context.monthlyGainNis,
          },
          { surface: context.sourceSurface, siteId: context.siteId },
        );
        track(
          "conversion_complete",
          {
            providerId: selectedProvider?.providerId ?? "any",
            recommendationType: context.recommendationType,
            revenueStream:
              context.ctaKind === "configure" ||
              context.ctaKind === "external"
                ? "affiliate"
                : "lead",
          },
          { surface: context.sourceSurface, siteId: context.siteId },
        );
        setStep("confirmation");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Submission failed";
        track(
          "lead_submit_failed",
          {
            errorCode: message,
            step: "network",
          },
          { surface: context.sourceSurface, siteId: context.siteId },
        );
        setSubmitError(
          "We couldn't send that. Retry, and we'll save your details if the second attempt fails.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [context, selectedProvider],
  );

  const finish = useCallback(() => {
    setStep("idle");
    setContext(null);
    setSelectedProviderState(null);
    setProviders([]);
  }, []);

  // ---- context values ---------------------------------------------
  const startApi = useMemo<ConversionFlowApi>(
    () => ({ start, close: () => close("close") }),
    [start, close],
  );
  const stateApi = useMemo<ConversionFlowStateApi>(
    () => ({
      step,
      context,
      selectedProvider,
      providers,
      isSubmitting,
      submitError,
      advanceFromContext,
      selectProvider,
      submitLead,
      finish,
      close,
    }),
    [
      step,
      context,
      selectedProvider,
      providers,
      isSubmitting,
      submitError,
      advanceFromContext,
      selectProvider,
      submitLead,
      finish,
      close,
    ],
  );

  return (
    <StartContext.Provider value={startApi}>
      <StateContext.Provider value={stateApi}>
        {children}
        <ConversionModal />
      </StateContext.Provider>
    </StartContext.Provider>
  );
}
