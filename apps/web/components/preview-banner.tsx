"use client";

import React from "react";
import { IS_PREVIEW } from "@/lib/env";
import { AlertTriangleIcon } from "lucide-react";

export function PreviewBanner() {
  if (!IS_PREVIEW) return null;

  return (
    <div
      data-slot="preview-banner"
      className="sticky top-0 z-50 w-full h-9 bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 text-xs font-medium flex items-center justify-center gap-2 shrink-0 select-none backdrop-blur-md"
    >
      <AlertTriangleIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <span className="truncate">
        <strong className="font-semibold uppercase tracking-wider bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] mr-1.5 text-amber-700 dark:text-amber-300">
          Preview Mode
        </strong>
        This web app is in the pre-production/preview phase. Data is subject to change or deletion at any time.
      </span>
    </div>
  );
}
