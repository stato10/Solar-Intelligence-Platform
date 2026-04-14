import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AuthTokenCookieSync } from "@/components/auth/auth-token-cookie-sync";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/toaster";
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
          <AppShell>{children}</AppShell>
        </Toaster>
      </body>
    </html>
  );
}
