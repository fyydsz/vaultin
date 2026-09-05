"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { CheckIcon, SunIcon, MoonIcon, LaptopIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const themes = [
    {
      id: "light",
      label: "Light",
      icon: SunIcon,
      previewBg: "bg-white border-zinc-200 text-zinc-900",
      previewSidebar: "bg-zinc-100 border-zinc-200",
      previewCard: "bg-white border-zinc-200 shadow-xs",
    },
    {
      id: "dark",
      label: "Dark",
      icon: MoonIcon,
      previewBg: "bg-zinc-950 border-zinc-800 text-zinc-100",
      previewSidebar: "bg-zinc-900 border-zinc-800",
      previewCard: "bg-zinc-900 border-zinc-800 shadow-xs",
    },
    {
      id: "system",
      label: "System",
      icon: LaptopIcon,
      previewBg: "bg-gradient-to-br from-white to-zinc-950 border-zinc-400 text-zinc-800",
      previewSidebar: "bg-zinc-200/80 dark:bg-zinc-900",
      previewCard: "bg-white/90 dark:bg-zinc-900/90 border-border shadow-xs",
    },
  ];

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Appearance
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Customize the theme and interface styling
        </p>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium text-foreground">
          Color Theme
        </label>
        <p className="text-xs text-muted-foreground">
          Select your preferred theme for the Vaultin interface.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {themes.map((t) => {
            const isSelected = theme === t.id;
            const Icon = t.icon;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex flex-col items-start gap-2.5 rounded-xl border-2 p-3 text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-primary bg-accent/40 shadow-xs"
                    : "border-border/60 hover:border-border hover:bg-muted/40"
                )}
              >
                {/* Mini mockup preview container */}
                <div
                  className={cn(
                    "w-full h-24 rounded-lg border p-2 flex flex-col justify-between overflow-hidden relative",
                    t.previewBg
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-red-400" />
                    <div className="size-2 rounded-full bg-amber-400" />
                    <div className="size-2 rounded-full bg-emerald-400" />
                  </div>

                  <div className="flex gap-2 h-12">
                    <div
                      className={cn(
                        "w-1/3 rounded border p-1 flex flex-col gap-1",
                        t.previewSidebar
                      )}
                    >
                      <div className="h-1.5 w-3/4 rounded-xs bg-muted-foreground/30" />
                      <div className="h-1.5 w-1/2 rounded-xs bg-muted-foreground/30" />
                    </div>
                    <div
                      className={cn(
                        "flex-1 rounded border p-1.5 flex flex-col justify-between",
                        t.previewCard
                      )}
                    >
                      <div className="h-2 w-2/3 rounded-xs bg-primary/40" />
                      <div className="h-1.5 w-full rounded-xs bg-muted-foreground/20" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full pt-1">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {t.label}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckIcon className="size-2.5" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
