import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthForm } from "./_components/auth-form";

export default function AuthPage() {
  return (
    <section className="space-y-8">
      <div className="glass-card relative overflow-hidden rounded-3xl p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.14),transparent_45%),radial-gradient(circle_at_25%_75%,rgba(59,130,246,0.1),transparent_42%)]" />
        <div className="relative">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Secure access
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Sign in to your solar operations workspace
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Access your dashboards, insights, and optimization flows with one secure account.
          </p>
        </div>
      </div>
      <AuthForm />
      <div className="flex justify-start">
        <Button asChild variant="outline" size="lg">
          <Link href="/">Back Home</Link>
        </Button>
      </div>
    </section>
  );
}
