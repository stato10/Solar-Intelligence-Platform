import type { Metadata } from "next";
import { cookies } from "next/headers";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AuthTokenCookieSync } from "@/components/auth/auth-token-cookie-sync";
import { fetchTariffBySite } from "@/lib/api/settings-persist";
import { AppShell } from "@/components/layout/app-shell";
import { GeolocationBridge } from "@/components/layout/GeolocationBridge";
import { Toaster } from "@/components/ui/toaster";
import { ConversionFlowProvider } from "@/hooks/use-conversion-flow";
import { CurrencyProvider } from "@/hooks/use-currency";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solar Intelligence Platform",
  description: "AI-powered web application for residential solar optimization.",
};

/**
 * Resolve the currency the signed-in user should see money in: the active
 * site's Tariff currency. Best-effort — any failure (anonymous visitor, API
 * down, no tariff yet) falls back to ILS so the UI never breaks.
 */
async function resolveSessionCurrency(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sip.accessToken")?.value;
    const activeSiteId = cookieStore.get("sip.activeSiteId")?.value;
    if (!accessToken || !activeSiteId) return undefined;
    const tariff = await fetchTariffBySite(activeSiteId, accessToken);
    return tariff?.currency ?? undefined;
  } catch {
    return undefined;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionCurrency = await resolveSessionCurrency();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} ${jetBrainsMono.variable} antialiased`} suppressHydrationWarning>
        <Toaster>
          <AuthTokenCookieSync />
          {/* Captures the visitor's real location (with permission) so demo
              dashboards use live local weather/solar data. */}
          <GeolocationBridge />
          {/* CurrencyProvider is the single source of truth for "what
              currency should this user see money in?" — resolved from the
              active site's tariff, falling back to ILS (launch market) for
              anonymous visitors or when no tariff exists yet. */}
          <CurrencyProvider currency={sessionCurrency ?? "ILS"}>
            {/* ConversionFlowProvider mounts a single modal instance for
                every CTA in the product (doc 15). It must sit inside
                the toaster/auth boundary so the modal can render
                success chips and reach accessToken-backed APIs. */}
            <ConversionFlowProvider>
              <AppShell>{children}</AppShell>
            </ConversionFlowProvider>
          </CurrencyProvider>
        </Toaster>
      </body>
    </html>
  );
}
