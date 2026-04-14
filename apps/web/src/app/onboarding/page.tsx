import { OnboardingWizard } from "./_components/onboarding-wizard";

export const metadata = {
  title: "Onboarding | Solar Intelligence Platform",
  description: "Set up your solar site, system details, and tariffs.",
};

export default function OnboardingPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] w-full flex-col items-center justify-center py-10 md:py-16">
      <OnboardingWizard />
    </div>
  );
}
