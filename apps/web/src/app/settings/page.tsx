import { Cog, Database, SlidersHorizontal } from "lucide-react";

export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Settings Placeholder
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Base structure for profile, site, system, and integration settings.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Cog,
            title: "Profile",
            text: "User preferences and account-level controls."
          },
          {
            icon: SlidersHorizontal,
            title: "System Setup",
            text: "Solar system configuration and household device profile."
          },
          {
            icon: Database,
            title: "Data Sources",
            text: "Provider configuration and sync status controls."
          }
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-xl border border-border bg-card p-5"
          >
            <item.icon className="mb-3 h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
