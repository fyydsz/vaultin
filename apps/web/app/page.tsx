"use client";

import { useMounted } from "@/hooks/use-mounted";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { LoginForm } from "@/components/login-form";
import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  GalleryVerticalEndIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  PiggyBankIcon,
  TrendingUpIcon,
  SparklesIcon,
  CheckCircle2Icon,
} from "lucide-react";

export default function Home() {
  const mounted = useMounted();
  const { isAuthenticated, user, isLoading } = useAuth();

  const showLoading = !mounted || isLoading;

  return (
    <div className="min-h-svh flex flex-col bg-background text-foreground">
      {/* ========================================================================= */}
      {/* DESKTOP VIEW (lg screens and above): 2-Column Split (Left Hero, Right Login) */}
      {/* ========================================================================= */}
      <div className="hidden lg:grid lg:min-h-svh lg:grid-cols-2">
        {/* Left Column: Brand & Hero Messaging */}
        <div className="relative flex flex-col justify-between p-12 bg-muted/30 border-r border-border overflow-hidden">
          {/* Subtle background glow effect */}
          <div className="absolute -left-24 -top-24 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -right-24 -bottom-24 size-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GalleryVerticalEndIcon className="size-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">Vaultin</span>
          </div>

          {/* Main Hero Content */}
          <div className="relative z-10 max-w-lg my-auto py-12 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur px-3.5 py-1 text-xs font-medium text-muted-foreground shadow-xs">
              <SparklesIcon className="size-3.5 text-primary" />
              <span>Smart Financial Freedom</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight xl:text-5xl leading-tight">
              Save Smarter, Reach Goals Faster.
            </h1>

            <p className="text-base xl:text-lg text-muted-foreground leading-relaxed">
              Take full control of your financial goals with simple budgeting, real-time analytics, and secure money-saving targets.
            </p>

            {/* Feature Badges */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3 rounded-xl border bg-background/60 backdrop-blur p-3.5 shadow-xs">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <PiggyBankIcon className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold">Multiple Vaults</h4>
                  <p className="text-[11px] text-muted-foreground">Custom target savings</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border bg-background/60 backdrop-blur p-3.5 shadow-xs">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <TrendingUpIcon className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold">Real-Time Insights</h4>
                  <p className="text-[11px] text-muted-foreground">Track monthly growth</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Vaultin App</span>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500">
              <ShieldCheckIcon className="size-3.5" />
              <span>Your data is protected</span>
            </div>
          </div>
        </div>

        {/* Right Column: Active Login Form / Dashboard Link */}
        <div className="relative flex flex-col justify-between p-12 bg-background">
          {/* Top Theme Toggle */}
          <div className="flex justify-end">
            <ModeToggle />
          </div>

          {/* Center Form Container */}
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="w-full max-w-sm">
              {showLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-xs text-muted-foreground">Checking session...</p>
                </div>
              ) : isAuthenticated ? (
                /* When user is already logged in */
                <div className="flex flex-col items-center gap-6 rounded-2xl border bg-card p-8 text-center shadow-sm animate-in fade-in-50">
                  <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2Icon className="size-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold tracking-tight">You are already signed in</h2>
                    <p className="text-sm text-muted-foreground">
                      Welcome back, <strong className="text-foreground">{user?.name}</strong> ({user?.email})
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className={cn(buttonVariants({ size: "lg" }), "w-full rounded-md")}
                  >
                    Go to Dashboard <ArrowRightIcon className="ml-2 size-4" />
                  </Link>
                </div>
              ) : (
                /* The Live Login Form */
                <LoginForm />
              )}
            </div>
          </div>

          {/* Bottom spacer for balance */}
          <div className="h-4" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE / TABLET VIEW (< lg screens): Hero View with CTA buttons for Mobile */}
      {/* ========================================================================= */}
      <div className="flex lg:hidden min-h-svh flex-col">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <GalleryVerticalEndIcon className="size-4" />
            </div>
            <span className="font-bold text-base tracking-tight">Vaultin</span>
          </div>
          <ModeToggle />
        </header>

        {/* Mobile Hero Content */}
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex max-w-md flex-col items-center gap-5">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3.5 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheckIcon className="size-3.5 text-primary" />
              <span>Your data is protected</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl leading-tight">
              Save Smarter, Reach Goals Faster.
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Take full control of your financial goals with simple budgeting, real-time analytics, and secure money-saving targets.
            </p>

            {/* Mobile Action Buttons */}
            <div className="w-full flex flex-col gap-3 pt-2">
              {showLoading ? (
                <div className="py-4 text-xs text-muted-foreground">Loading...</div>
              ) : isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className={cn(buttonVariants({ size: "lg" }), "w-full rounded-lg text-sm")}
                >
                  Go to Dashboard <ArrowRightIcon className="ml-2 size-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={cn(buttonVariants({ size: "lg" }), "w-full rounded-lg text-sm font-semibold")}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full rounded-lg text-sm font-semibold")}
                  >
                    Create Your Account
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Highlights */}
          <div className="mt-12 grid w-full max-w-md grid-cols-1 gap-3.5 text-left">
            <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <PiggyBankIcon className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold">Custom Savings Vaults</h4>
                <p className="text-[11px] text-muted-foreground">Organize goals and track target completion.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                <TrendingUpIcon className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold">Insightful Analytics</h4>
                <p className="text-[11px] text-muted-foreground">Real-time savings pace & growth charts.</p>
              </div>
            </div>
          </div>
        </main>

        {/* Mobile Footer */}
        <footer className="border-t py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Vaultin App. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
