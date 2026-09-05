"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import {
  GalleryVerticalEndIcon,
  Loader2Icon,
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { emitBackendError } from "@/lib/api";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBackendError, setIsBackendError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsBackendError(false);

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await login({
        identifier: trimmedIdentifier,
        password,
      });

      router.push("/dashboard");
    } catch (err: unknown) {
      const rawMessage =
        err instanceof Error
          ? err.message
          : "Failed to sign in. Please check your credentials.";

      const isNetworkOrBackendError =
        rawMessage.toLowerCase().includes("fetch") ||
        rawMessage.toLowerCase().includes("network") ||
        rawMessage.toLowerCase().includes("connect") ||
        rawMessage.toLowerCase().includes("backend") ||
        rawMessage.toLowerCase().includes("failed to fetch") ||
        rawMessage.toLowerCase().includes("load failed") ||
        rawMessage.toLowerCase().includes("timeout") ||
        rawMessage.toLowerCase().includes("abort") ||
        rawMessage.toLowerCase().includes("500") ||
        rawMessage.toLowerCase().includes("502") ||
        rawMessage.toLowerCase().includes("503") ||
        rawMessage.toLowerCase().includes("504");

      if (isNetworkOrBackendError) {
        emitBackendError({
          message: "Please check your connection and try again.",
          isBackendDown: true,
          source: "form",
        });
        setIsBackendError(true);
      } else {
        setError(rawMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              href="/"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <GalleryVerticalEndIcon className="size-6" />
              </div>
              <span className="sr-only">Vaultin</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-xs text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          {isBackendError && (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertCircleIcon className="size-4 shrink-0" />
              <AlertTitle className="font-semibold">Something went wrong</AlertTitle>
            </Alert>
          )}

          {error && !isBackendError && (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertCircleIcon className="size-4 shrink-0" />
              <AlertTitle className="font-semibold">Something went wrong</AlertTitle>
              <AlertDescription className="text-xs text-destructive/90">{error}</AlertDescription>
            </Alert>
          )}

          <Field>
            <FieldLabel htmlFor="identifier">Email or Username</FieldLabel>
            <Input
              id="identifier"
              type="text"
              placeholder="name@example.com or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="username"
              autoFocus
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 size-7 text-muted-foreground hover:text-foreground hover:bg-transparent"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </Button>
            </div>
          </Field>

          <Field>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </Field>

          <div className="text-center text-xs text-muted-foreground pt-1">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary font-medium underline underline-offset-4 hover:opacity-80"
            >
              Create an account
            </Link>
          </div>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center text-xs text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline underline-offset-4 hover:text-foreground">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-4 hover:text-foreground">
          Privacy Policy
        </a>.
      </FieldDescription>
    </div>
  );
}
