import Link from "next/link";
import { LockKeyhole, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Auth Placeholder</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          This route is ready for Phase 2 onboarding and authentication screens.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button size="lg">
            <LockKeyhole className="h-4 w-4" />
            Login Flow
          </Button>
          <Button variant="outline" size="lg">
            <UserPlus className="h-4 w-4" />
            Register Flow
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/">Back Home</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
