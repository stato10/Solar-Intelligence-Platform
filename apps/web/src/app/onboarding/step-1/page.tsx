import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OnboardingStep1Form } from "./_components/onboarding-step1-form";

export default function OnboardingStep1Page() {
  return (
    <section className="space-y-6">
      <OnboardingStep1Form />
      <div className="flex gap-3">
        <Button asChild variant="ghost" size="lg">
          <Link href="/auth">Back to Auth</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard">Skip for now</Link>
        </Button>
      </div>
    </section>
  );
}
