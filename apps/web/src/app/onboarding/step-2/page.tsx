import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OnboardingStep2Form } from "./_components/onboarding-step2-form";

export default function OnboardingStep2Page() {
  return (
    <section className="space-y-6">
      <OnboardingStep2Form />
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="ghost" size="lg">
          <Link href="/onboarding/step-1">Back to Step 1</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard">Skip for now</Link>
        </Button>
      </div>
    </section>
  );
}
