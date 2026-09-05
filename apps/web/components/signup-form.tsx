"use client";

import React, { useState, useEffect } from "react";
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
  CheckCircle2Icon,
  XCircleIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { api, emitBackendError } from "@/lib/api";
import { validateEmail } from "@/lib/validation";
import { PreviewNoticeDialog } from "@/components/preview-notice-dialog";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number (0-9)", test: (p: string) => /\d/.test(p) },
  { label: "Special character (!@#$...)", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const { register, login } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBackendError, setIsBackendError] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced username availability state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState<{
    available: boolean;
    reason?: string;
    message?: string;
  } | null>(null);

  // Debounce username check (400ms delay)
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      setUsernameAvailability(null);
      setIsCheckingUsername(false);
      return;
    }

    if (trimmed.length < 3) {
      setUsernameAvailability({
        available: false,
        reason: "Username must be at least 3 characters",
      });
      setIsCheckingUsername(false);
      return;
    }

    if (trimmed.length > 30) {
      setUsernameAvailability({
        available: false,
        reason: "Username cannot exceed 30 characters",
      });
      setIsCheckingUsername(false);
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(trimmed)) {
      setUsernameAvailability({
        available: false,
        reason: "Only letters, numbers, underscores, and dots are allowed",
      });
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.checkUsername(trimmed);
        setUsernameAvailability(res);
      } catch {
        setUsernameAvailability(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsBackendError(false);
    setSuccess(null);

    const trimmedName = name.trim();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedUsername || !trimmedEmail || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setError("Name must be between 2 and 50 characters");
      return;
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      setError("Username must be between 3 and 30 characters");
      return;
    }

    if (usernameAvailability && !usernameAvailability.available) {
      setError(usernameAvailability.reason || "Username is already taken");
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      setError("Username can only contain letters, numbers, underscores, and dots");
      return;
    }

    if (!validateEmail(trimmedEmail) || trimmedEmail.length > 100) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length > 100) {
      setError("Password cannot exceed 100 characters");
      return;
    }

    const failedRules = PASSWORD_RULES.filter((rule) => !rule.test(password));
    if (failedRules.length > 0) {
      setError(`Password requirements not met: ${failedRules.map((r) => r.label).join(", ")}`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: trimmedName,
        username: trimmedUsername,
        email: trimmedEmail,
        password,
      });

      setSuccess("Account created successfully! Logging you in...");

      // Automatically log the user in after registration
      await login({
        identifier: trimmedEmail,
        password,
      });

      router.push("/dashboard");
    } catch (err: unknown) {
      const rawMessage =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";

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
      setIsLoading(false);
    }
  };

  const passwordStrengthValid = PASSWORD_RULES.every((rule) => rule.test(password));

  const isSubmitDisabled =
    isLoading ||
    isCheckingUsername ||
    (usernameAvailability !== null && !usernameAvailability.available) ||
    !name.trim() ||
    !username.trim() ||
    !email.trim() ||
    !password ||
    !passwordStrengthValid ||
    !confirmPassword;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <PreviewNoticeDialog />
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
            <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
            <FieldDescription>
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline underline-offset-4 hover:opacity-80">
                Sign in
              </Link>
            </FieldDescription>
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

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-600 font-medium animate-in fade-in-50">
              <CheckCircle2Icon className="size-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="name">Full Name</FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
              maxLength={50}
              autoFocus
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm font-medium text-muted-foreground select-none">
                @
              </span>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase());
                  if (error) setError(null);
                }}
                disabled={isLoading}
                required
                maxLength={30}
                autoComplete="username"
                className="pl-7 pr-8 font-mono lowercase"
              />
              <div className="absolute right-2.5 flex items-center">
                {isCheckingUsername && (
                  <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                )}
                {!isCheckingUsername && usernameAvailability && (
                  usernameAvailability.available ? (
                    <CheckCircle2Icon className="size-4 text-emerald-500" />
                  ) : (
                    <XCircleIcon className="size-4 text-destructive" />
                  )
                )}
              </div>
            </div>
            {isCheckingUsername ? (
              <p className="text-[11px] text-muted-foreground animate-pulse mt-1">
                 Checking username availability...
              </p>
            ) : usernameAvailability ? (
              usernameAvailability.available ? (
                <p className="text-[11px] text-emerald-500 font-medium mt-1">
                  ✓ Username is available
                </p>
              ) : (
                <p className="text-[11px] text-destructive font-medium mt-1">
                  {usernameAvailability.reason || "Username is already taken"}
                </p>
              )
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              maxLength={100}
              autoComplete="email"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                maxLength={100}
                autoComplete="new-password"
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
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                {PASSWORD_RULES.map((rule, i) => {
                  const passed = rule.test(password);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-1.5 text-[11px] transition-colors",
                        passed
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {passed ? (
                        <CheckCircle2Icon className="size-3 shrink-0" />
                      ) : (
                        <XCircleIcon className="size-3 shrink-0" />
                      )}
                      <span>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
              maxLength={100}
              autoComplete="new-password"
            />
          </Field>

          <Field>
            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={isSubmitDisabled}
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </Field>
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
