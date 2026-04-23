/**
 * Analytics client — thin wrapper that owns the event envelope
 * (docs/redesign/17-monetization.md §3). Every surface that wants to
 * emit an analytics event calls `track(event, props)` and lets this
 * module fill in the envelope fields (ts, sessionId, surface).
 *
 * The current implementation logs to the browser console in
 * development and is a no-op in production. Commit 5 of Sprint 2
 * swaps the body for a real transport (beacon / server-side forward)
 * once the backend route exists.
 *
 * Important rules enforced here:
 *   - Envelope never mutates caller's props.
 *   - Raw PII (name / phone / email) is stripped at the boundary.
 *     Callers that want to reference a submitted lead pass `leadId`.
 *   - Errors inside `track()` are swallowed — analytics must never
 *     break a CTA path.
 */

const PII_KEYS: readonly string[] = [
  "name",
  "phone",
  "email",
  "contactName",
  "contactPhone",
  "contactEmail",
];

let sessionIdCache: string | null = null;

/** Returns (and lazily creates) a stable per-tab session id. */
function getSessionId(): string {
  if (typeof window === "undefined") return "ssr-session";
  if (sessionIdCache) return sessionIdCache;
  try {
    const stored = window.sessionStorage.getItem("sip.sessionId");
    if (stored) {
      sessionIdCache = stored;
      return stored;
    }
    const fresh =
      "s-" +
      Math.random().toString(36).slice(2) +
      Date.now().toString(36);
    window.sessionStorage.setItem("sip.sessionId", fresh);
    sessionIdCache = fresh;
    return fresh;
  } catch {
    // SessionStorage may be blocked (private mode / third-party frames).
    sessionIdCache = `s-${Date.now().toString(36)}`;
    return sessionIdCache;
  }
}

/** Shallow PII strip — defensive, not cryptographic. */
function scrubPii(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (PII_KEYS.includes(k)) continue;
    out[k] = v;
  }
  return out;
}

export interface TrackOptions {
  surface?: string;
  userId?: string;
  siteId?: string;
}

export function track(
  event: string,
  props: Record<string, unknown> = {},
  options: TrackOptions = {},
): void {
  try {
    const envelope = {
      event,
      ts: new Date().toISOString(),
      sessionId: getSessionId(),
      userId: options.userId,
      siteId: options.siteId,
      surface: options.surface ?? "unknown",
      props: scrubPii(props),
    };
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", envelope);
    }
    // Commit 5: forward to `/analytics/events` via a non-blocking
    // `navigator.sendBeacon` call.
  } catch {
    // Intentional: never propagate analytics errors.
  }
}
