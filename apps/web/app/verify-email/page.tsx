"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { buttonVariants } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import {
  CheckCircle2Icon,
  AlertCircleIcon,
  GalleryVerticalEndIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statusParam = searchParams.get("status");
  const verifiedParam = searchParams.get("verified");
  const errorParam = searchParams.get("error");
  const tokenParam = searchParams.get("token");

  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    const notifyAuthSync = () => {
      try {
        localStorage.setItem("vaultin_auth_sync", Date.now().toString());
        const bc = new BroadcastChannel("vaultin_auth_sync");
        bc.postMessage({ type: "EMAIL_VERIFIED" });
        bc.close();
      } catch {}
    };

    // 1. Direct error parameter from backend redirect
    if (statusParam === "error" || errorParam) {
      setIsSuccess(false);
      setIsLoading(false);
      if (
        errorParam?.toLowerCase().includes("verified") ||
        errorParam?.toLowerCase().includes("already")
      ) {
        setErrorMessage("This verification link has already been used or your email is already verified.");
      } else if (errorParam?.toLowerCase().includes("expired")) {
        setErrorMessage("This verification link has expired. Please request a new verification link.");
      } else {
        setErrorMessage("This verification link is invalid or has expired.");
      }
      return;
    }

    // 2. Direct success parameter from backend redirect
    if (statusParam === "success" || verifiedParam === "true") {
      setIsSuccess(true);
      setIsLoading(false);
      notifyAuthSync();
      return;
    }

    // 3. Client-side token verification if token provided directly
    if (tokenParam) {
      setIsLoading(true);
      authClient
        .verifyEmail({
          query: {
            token: tokenParam,
          },
        })
        .then((res) => {
          if (res.error) {
            setIsSuccess(false);
            setErrorMessage(res.error.message || "Failed to verify email. The link may be invalid or expired.");
          } else {
            setIsSuccess(true);
            notifyAuthSync();
          }
        })
        .catch((err: any) => {
          setIsSuccess(false);
          setErrorMessage(err.message || "Failed to verify email. Please try again.");
        })
        .finally(() => {
          setIsLoading(false);
        });
      return;
    }

    // 4. Default fallback when opened without parameters
    setIsSuccess(false);
    setErrorMessage("No verification link or token provided.");
    setIsLoading(false);
  }, [statusParam, verifiedParam, errorParam, tokenParam]);

  const handleCloseTab = () => {
    if (typeof window !== "undefined") {
      window.close();
    }
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="absolute top-4 right-4 md:top-6 md:right-6">
        <ModeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 text-center mb-6">
          <Link href="/" className="flex flex-col items-center gap-2 font-medium">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GalleryVerticalEndIcon className="size-6" />
            </div>
            <span className="sr-only">Vaultin</span>
          </Link>
          <span className="text-sm font-semibold tracking-tight text-muted-foreground">
            Vaultin
          </span>
        </div>

        {/* Status Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm text-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2Icon className="size-10 animate-spin text-primary" />
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Verifying your email...
                </h2>
                <p className="text-xs text-muted-foreground">
                  Please wait while we confirm your verification token.
                </p>
              </div>
            </div>
          ) : isSuccess ? (
            /* SUCCESS STATE - Ultra Lightweight */
            <div className="flex flex-col items-center gap-5">
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/10">
                <CheckCircle2Icon className="size-7" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Email Verified!
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You may now safely close this tab.
                </p>
              </div>

              <div className="w-full pt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleCloseTab}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "w-full gap-2 cursor-pointer"
                  )}
                >
                  <XIcon className="size-4" />
                  Close this tab
                </button>
              </div>
            </div>
          ) : (
            /* ERROR / EXPIRED STATE */
            <div className="flex flex-col items-center gap-5">
              <div className="flex size-14 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-8 ring-rose-500/10">
                <AlertCircleIcon className="size-7" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Verification Link Invalid or Expired
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {errorMessage ||
                    "This verification link has already been used or has expired."}
                </p>
              </div>

              <div className="w-full pt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleCloseTab}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "w-full gap-2 cursor-pointer"
                  )}
                >
                  <XIcon className="size-4" />
                  Close this tab
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <Loader2Icon className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
