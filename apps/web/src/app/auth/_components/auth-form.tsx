"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/lib/contracts";
import { AuthApiError, loginAuth, registerAuth } from "@/lib/api/auth";

type AuthMode = "login" | "register";

const ACCESS_TOKEN_KEY = "sip.accessToken";
const AUTH_USER_KEY = "sip.authUser";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function clearError() {
    if (errorMessage) {
      setErrorMessage(null);
    }
  }

  function switchMode(nextMode: AuthMode) {
    if (pending || nextMode === mode) {
      return;
    }
    setMode(nextMode);
    setErrorMessage(null);
  }

  function validateFields(): string | null {
    if (mode === "register" && fullName.trim().length < 2) {
      return "Full name must contain at least 2 characters.";
    }
    if (!email.trim()) {
      return "Email is required.";
    }
    if (password.length < 8) {
      return "Password must contain at least 8 characters.";
    }
    return null;
  }

  function persistSession(accessToken: string, user: AuthUser) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    document.cookie = `${ACCESS_TOKEN_KEY}=${encodeURIComponent(accessToken)}; path=/; max-age=604800; samesite=lax`;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const validationError = validateFields();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setPending(true);
    try {
      const result =
        mode === "register"
          ? await registerAuth({
              fullName: fullName.trim(),
              email: email.trim(),
              password
            })
          : await loginAuth({
              email: email.trim(),
              password
            });

      if (!result.accessToken) {
        throw new Error("Authentication response is missing access token");
      }

      persistSession(result.accessToken, result.user);
      router.push("/onboarding/step-1");
    } catch (error) {
      if (error instanceof AuthApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Unknown authentication error");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="glass-card rounded-3xl p-8">
      <h2 className="text-2xl font-semibold tracking-tight">Authentication</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Sign in or create an account to continue to the dashboard.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          type="button"
          size="lg"
          variant={mode === "login" ? "default" : "outline"}
          onClick={() => switchMode("login")}
          disabled={pending}
        >
          <LockKeyhole className="h-4 w-4" />
          Login
        </Button>
        <Button
          type="button"
          size="lg"
          variant={mode === "register" ? "default" : "outline"}
          onClick={() => switchMode("register")}
          disabled={pending}
        >
          <UserPlus className="h-4 w-4" />
          Register
        </Button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {mode === "register" ? (
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              className="h-11 w-full rounded-xl border border-border bg-background/80 px-3 text-sm outline-none transition-colors focus:border-primary/50"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(event) => {
                clearError();
                setFullName(event.target.value);
              }}
              disabled={pending}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="h-11 w-full rounded-xl border border-border bg-background/80 px-3 text-sm outline-none transition-colors focus:border-primary/50"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              clearError();
              setEmail(event.target.value);
            }}
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            className="h-11 w-full rounded-xl border border-border bg-background/80 px-3 text-sm outline-none transition-colors focus:border-primary/50"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(event) => {
              clearError();
              setPassword(event.target.value);
            }}
            disabled={pending}
          />
        </div>

        {errorMessage ? (
          <p className="state-danger rounded-xl border px-3 py-2 text-sm">
            {errorMessage}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending
            ? "Please wait..."
            : mode === "register"
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
