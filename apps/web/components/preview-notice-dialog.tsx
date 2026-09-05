"use client";

import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IS_PREVIEW } from "@/lib/env";
import { AlertTriangleIcon, ShieldAlertIcon } from "lucide-react";

interface PreviewNoticeDialogProps {
  /** If provided, overrides default auto-open behavior */
  open?: boolean;
  /** Callback when dialog open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Storage key to prevent showing repeatedly in same session. Defaults to showing every time if false. */
  sessionRemember?: boolean;
}

export function PreviewNoticeDialog({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  sessionRemember = false,
}: PreviewNoticeDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  useEffect(() => {
    if (!IS_PREVIEW) return;

    if (sessionRemember) {
      const hasSeenNotice = sessionStorage.getItem("has_seen_preview_notice");
      if (!hasSeenNotice) {
        setInternalOpen(true);
      }
    } else {
      setInternalOpen(true);
    }
  }, [sessionRemember]);

  const isControlled = externalOpen !== undefined;
  const isOpen = isControlled ? externalOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (sessionRemember && !newOpen) {
      sessionStorage.setItem("has_seen_preview_notice", "true");
    }
    if (isControlled) {
      externalOnOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  if (!IS_PREVIEW) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent size="default">
        <AlertDialogHeader className="text-left">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1 font-semibold">
            <div className="flex size-8 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <ShieldAlertIcon className="size-5" />
            </div>
            <span>Preview Environment Mode</span>
          </div>
          <AlertDialogTitle className="text-base font-semibold">
            Attention Before Registering
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
            This web application is currently running in <strong>Preview / Pre-production</strong> (Under Development). Any data you create, modify, or delete in this environment is temporary and <strong>may be changed or deleted without notice</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2">
          <AlertDialogAction
            onClick={() => handleOpenChange(false)}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-medium"
          >
            I Understand
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
