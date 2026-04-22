"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Eye, LineChart, Lock } from "lucide-react";

export function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Auto-launch the onboarding once on mount if not completed.
  useEffect(() => {
    const hasSeen = localStorage.getItem("sip.onboarding.seen");
    const searchParams = new URLSearchParams(window.location.search);
    const forceTour = searchParams.get("tour") === "true";

    if (!hasSeen || forceTour) {
      // Small delay for dramatic effect upon first load
      const timer = setTimeout(() => setOpen(true), 1500);
      
      // Clean up the URL if we forced it
      if (forceTour) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for manual trigger event
  useEffect(() => {
    const handleOpen = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener("sip:open-onboarding", handleOpen);
    return () => window.removeEventListener("sip:open-onboarding", handleOpen);
  }, []);

  const complete = () => {
    localStorage.setItem("sip.onboarding.seen", "true");
    setOpen(false);
  };

  const next = () => setStep((s) => s + 1);

  const steps = [
    {
      title: "Welcome to Solar Intelligence",
      description: "We analyze your solar system using AI + real-time regional weather physics.",
      icon: <BrainCircuit className="w-16 h-16 text-indigo-400 mb-4" />,
    },
    {
      title: "Detecting Hidden Losses",
      description: "We cross-reference the exact weather over your panels with expected generation to find exactly how much money you are losing (₪) per month.",
      icon: <Eye className="w-16 h-16 text-rose-400 mb-4" />,
    },
    {
      title: "Increasing Your Profit",
      description: "We recommend concrete, actionable steps to patch those financial leaks — from washing your panels to capturing lost energy in batteries.",
      icon: <LineChart className="w-16 h-16 text-emerald-400 mb-4" />,
    },
    {
      title: "Unlock Real-Time Precision",
      description: "Right now you are seeing general AI Estimations. For verified data, you can connect your physical system at any time.",
      icon: <Lock className="w-16 h-16 text-amber-400 mb-4" />,
    }
  ];

  const currentStep = steps[step];

  return (
    <Dialog open={open} onOpenChange={complete}>
      <DialogContent className="sm:max-w-md bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader>
          <div className="flex justify-center mt-6">
            {currentStep.icon}
          </div>
          <DialogTitle className="text-center text-xl pb-2">{currentStep.title}</DialogTitle>
          <DialogDescription className="text-center text-slate-400 text-base pb-4 px-2">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>
        
        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-indigo-500" : "w-2 bg-slate-800"}`} 
            />
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2 pt-2 border-t border-slate-800/50">
          {step < steps.length - 1 ? (
            <Button onClick={next} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
              Continue
            </Button>
          ) : (
            <>
              <Button onClick={complete} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                Start Exploring
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
