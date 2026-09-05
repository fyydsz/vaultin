"use client";

import { useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  BACKEND_ERROR_EVENT,
  BACKEND_RECOVERED_EVENT,
  BackendErrorEventDetail,
} from "@/lib/api";

const BACKEND_TOAST_ID = "backend-connection-error";

export function BackendStatusListener() {
  const pathname = usePathname();

  const handleBackendError = useCallback((e: Event) => {
    const customEvent = e as CustomEvent<BackendErrorEventDetail>;
    const detail = customEvent.detail;
    const isSessionCheck = detail?.isSessionCheck;
    const isFormSubmit = detail?.source === "form";

    // Suppress toast only when submitting login/signup forms (form displays its own red Alert)
    if (isFormSubmit) {
      return;
    }

    // Suppress general background errors on dedicated /login and /signup pages unless it's a session check
    const isDedicatedAuthPage =
      pathname === "/login" ||
      pathname === "/signup" ||
      pathname?.startsWith("/login") ||
      pathname?.startsWith("/signup");

    if (isDedicatedAuthPage && !isSessionCheck) {
      return;
    }

    const message =
      detail?.message || "An Unexpected Error Occurred";

    toast.error("Something went wrong", {
      id: BACKEND_TOAST_ID,
      description: message,
      position: "bottom-right",
      duration: 4000,
    });
  }, [pathname]);

  const handleBackendRecovered = useCallback(() => {
    toast.dismiss(BACKEND_TOAST_ID);
  }, []);

  useEffect(() => {
    window.addEventListener(BACKEND_ERROR_EVENT, handleBackendError);
    window.addEventListener(BACKEND_RECOVERED_EVENT, handleBackendRecovered);

    return () => {
      window.removeEventListener(BACKEND_ERROR_EVENT, handleBackendError);
      window.removeEventListener(BACKEND_RECOVERED_EVENT, handleBackendRecovered);
    };
  }, [handleBackendError, handleBackendRecovered]);

  return null;
}
