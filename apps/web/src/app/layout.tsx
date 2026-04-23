import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AuthTokenCookieSync } from "@/components/auth/auth-token-cookie-sync";
import { AppShell } from "@/components/layout/app-shell";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} ${jetBrainsMono.variable} antialiased`} suppressHydrationWarning>
        <Toaster>
          <AuthTokenCookieSync />
          {/* CurrencyProvider is the single source of truth for "what
              currency should this user see money in?" At the root it
              defaults to ILS (launch market); page-level providers can
              override once they've resolved the active site's tariff. */}
          <CurrencyProvider currency="ILS">
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
