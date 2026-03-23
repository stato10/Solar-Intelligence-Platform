import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthForm } from "./_components/auth-form";

export default function AuthPage() {
  return (
    <section className="space-y-6">
      <AuthForm />
      <div>
        <Button asChild variant="ghost" size="lg">
          <Link href="/">Back Home</Link>
        </Button>
      </div>
    </section>
  );
}
