import { Cog, Database, SlidersHorizontal } from "lucide-react";

const SETTINGS_BLOCKS = [
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
];

export default function SettingsPage() {
  return (
    <section className="space-y-8">
      <div className="glass-card relative overflow-hidden rounded-3xl p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.14),transparent_45%),radial-gradient(circle_at_25%_75%,rgba(59,130,246,0.1),transparent_42%)]" />
        <p className="relative text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Configuration
        </p>
        <h1 className="relative mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          Platform settings
        </h1>
        <p className="relative mt-3 max-w-2xl text-sm text-muted-foreground">
          Base structure for profile, site, system, and integration settings.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {SETTINGS_BLOCKS.map((item) => (
          <article
            key={item.title}
            className="glass-card rounded-2xl p-5"
          >
            <div className="mb-4 inline-flex rounded-lg bg-primary/12 p-2 text-primary">
              <item.icon className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
