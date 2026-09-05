"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { MailWarningIcon, Loader2Icon, MailCheckIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COOLDOWN_SECONDS = 60;
const STORAGE_KEY = "vaultin_email_resend_cooldown";

interface EmailVerificationBannerProps {
  className?: string;
}

export function EmailVerificationBanner({ className }: EmailVerificationBannerProps) {
  const { user, sendVerificationEmail, refreshUser } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [hasSentInSession, setHasSentInSession] = useState(false);

  // Restore cooldown from localStorage and listen to global email sent events
  useEffect(() => {
    const restoreCooldown = () => {
      try {
        const storedTime = localStorage.getItem(STORAGE_KEY);
        if (storedTime) {
          const remaining = Math.max(
            0,
            Math.ceil((parseInt(storedTime, 10) - Date.now()) / 1000)
          );
          if (remaining > 0) {
            setCooldown(remaining);
            setHasSentInSession(true);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch {
        // localStorage fallback
      }
    };

    restoreCooldown();

    window.addEventListener("vaultin_email_sent", restoreCooldown);
    window.addEventListener("storage", restoreCooldown);

    return () => {
      window.removeEventListener("vaultin_email_sent", restoreCooldown);
      window.removeEventListener("storage", restoreCooldown);
    };
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  // If user is not logged in or email is already verified, do not render banner
  if (!user || user.emailVerified) {
    return null;
  }

  // Triggered ONLY on user button click
  const handleSendEmail = async () => {
    if (isSending || cooldown > 0) return;

    setIsSending(true);
    try {
      await sendVerificationEmail();
      setHasSentInSession(true);
      toast.success("Verification email sent!", {
        description: `Please check your inbox or spam folder at ${user.email}.`,
      });

      // Set cooldown
      const targetTime = Date.now() + COOLDOWN_SECONDS * 1000;
      try {
        localStorage.setItem(STORAGE_KEY, targetTime.toString());
      } catch {}
      setCooldown(COOLDOWN_SECONDS);
    } catch (err: any) {
      toast.error("Failed to send verification email", {
        description: err.message || "Please try again later.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckStatus = async () => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      await refreshUser();
      toast.info("Refreshed status", {
        description: "Checking if your email has been verified...",
      });
    } catch {
      // Handled silently
    } finally {
      setIsChecking(false);
    }
  };

  const isEmailSentState = hasSentInSession || cooldown > 0;

  return (
    <div
      className={cn(
        "relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-950 dark:text-amber-200 transition-all duration-200",
        className
      )}
      role="alert"
    >
      <div className="flex items-center gap-2.5 text-sm">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400">
          {isEmailSentState ? (
            <MailCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <MailWarningIcon className="size-4" />
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 leading-tight">
          <span className="font-semibold text-amber-900 dark:text-amber-100">
            {isEmailSentState ? "Check your inbox" : "Verify your email"}
          </span>
          <span className="hidden sm:inline text-amber-600/50 dark:text-amber-400/50">
            •
          </span>
          <span className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-300/90">
            {isEmailSentState ? (
              <>
                We sent a verification link to{" "}
                <strong className="font-medium text-amber-950 dark:text-amber-100 underline decoration-amber-500/30">
                  {user.email}
                </strong>
                . Check your inbox or spam.
              </>
            ) : (
              <>
                Your email (
                <strong className="font-medium text-amber-950 dark:text-amber-100">
                  {user.email}
                </strong>
                ) is not verified. Click the button to get a verification link.
              </>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCheckStatus}
          disabled={isChecking}
          className="h-8 px-2.5 text-xs bg-transparent border-amber-500/30 text-amber-900 hover:bg-amber-500/15 hover:text-amber-950 dark:text-amber-200 dark:hover:bg-amber-500/20"
          title="Check verification status"
        >
          {isChecking ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <RefreshCwIcon className="size-3.5" />
          )}
          <span className="hidden xs:inline ml-1.5">Check Status</span>
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={handleSendEmail}
          disabled={isSending || cooldown > 0}
          className="h-8 px-3 text-xs bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400 font-medium shadow-xs"
        >
          {isSending ? (
            <>
              <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
              Sending...
            </>
          ) : cooldown > 0 ? (
            `Resend in ${cooldown}s`
          ) : isEmailSentState ? (
            "Resend Verification Email"
          ) : (
            "Send Verification Email"
          )}
        </Button>
      </div>
    </div>
  );
}
