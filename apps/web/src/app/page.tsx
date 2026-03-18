"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="rounded-xl border border-border bg-card p-8"
      >
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Design system baseline is active
        </div>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
          Premium web foundation for Solar Intelligence Platform
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          This screen validates the Phase 1 design baseline: tokenized colors,
          reusable UI primitives, consistent shell layout, and motion-ready
          interactions.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg">
            Start Phase 2 Domain Work
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg">
            Review API Contracts
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Sun,
            title: "Forecast Layer",
            text: "Prepared for solar, weather, and air-quality pipelines."
          },
          {
            icon: ShieldCheck,
            title: "Risk Layer",
            text: "UI shell supports status, alerts, and scenario visuals."
          },
          {
            icon: Sparkles,
            title: "Insight Layer",
            text: "Design tokens are ready for AI summary components."
          }
        ].map((item, index) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * index, duration: 0.28, ease: "easeOut" }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <item.icon className="mb-3 h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
