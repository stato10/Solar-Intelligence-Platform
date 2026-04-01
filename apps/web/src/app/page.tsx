"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  ChartNoAxesCombined,
  Gauge,
  ShieldCheck,
  Sparkles,
  Sun,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const PLATFORM_HIGHLIGHTS = [
  {
    icon: Gauge,
    title: "Live Performance",
    text: "Track production, losses, and utilization in one operational layer."
  },
  {
    icon: BellRing,
    title: "Risk Visibility",
    text: "Surface maintenance risks early with transparent alert context."
  },
  {
    icon: Wallet,
    title: "Financial Clarity",
    text: "Translate system behavior into daily and monthly value impact."
  }
];

export default function Home() {
  return (
    <section className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="glass-card relative overflow-hidden rounded-3xl p-8 md:p-10"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.18),transparent_45%),radial-gradient(circle_at_20%_70%,rgba(59,130,246,0.12),transparent_42%)]" />

        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Smart Solar Operations
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-5xl">
            Run your solar site like a real operations center.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Solar Intelligence connects system data, AI explanations, and financial impact
            into one professional dashboard built for clear decisions.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Open Live Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLATFORM_HIGHLIGHTS.map((item, index) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * index, duration: 0.28, ease: "easeOut" }}
            className="glass-card rounded-2xl p-5"
          >
            <div className="mb-4 inline-flex rounded-lg bg-primary/12 p-2 text-primary">
              <item.icon className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
          </motion.article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="glass-card rounded-2xl p-6">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Why this feels professional
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-card/60 p-4">
              <div className="mb-2 inline-flex rounded-md bg-primary/12 p-1.5 text-primary">
                <ChartNoAxesCombined className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold">Data to decisions</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Move from raw metrics to clear action recommendations.
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-card/60 p-4">
              <div className="mb-2 inline-flex rounded-md bg-primary/12 p-1.5 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold">Trust and transparency</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Every AI insight keeps reason and source references visible.
              </p>
            </div>
          </div>
        </article>

        <article className="glass-card rounded-2xl p-6">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Quick access
          </p>
          <div className="mt-4 space-y-3">
            <Link
              href="/dashboard"
              className="group flex items-center justify-between rounded-xl border border-border/80 bg-card/60 px-4 py-3 text-sm transition-colors hover:bg-muted/40"
            >
              <span className="inline-flex items-center gap-2 font-medium">
                <Sun className="h-4 w-4 text-primary" />
                Dashboard
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/maintenance"
              className="group flex items-center justify-between rounded-xl border border-border/80 bg-card/60 px-4 py-3 text-sm transition-colors hover:bg-muted/40"
            >
              <span className="inline-flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Maintenance
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/savings"
              className="group flex items-center justify-between rounded-xl border border-border/80 bg-card/60 px-4 py-3 text-sm transition-colors hover:bg-muted/40"
            >
              <span className="inline-flex items-center gap-2 font-medium">
                <Wallet className="h-4 w-4 text-primary" />
                Savings
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
