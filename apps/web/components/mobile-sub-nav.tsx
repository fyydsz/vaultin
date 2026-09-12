"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ReceiptTextIcon,
  TrendingUpIcon,
  TargetIcon,
  PiggyBankIcon,
} from "lucide-react";

export function MobileSubNav() {
  const pathname = usePathname();

  const isActivityGroup =
    pathname.startsWith("/dashboard/transactions") ||
    pathname.startsWith("/dashboard/cashflow");

  const isPlanningGroup =
    pathname.startsWith("/dashboard/goals") ||
    pathname.startsWith("/dashboard/budgets");

  if (!isActivityGroup && !isPlanningGroup) {
    return null;
  }

  const items = isActivityGroup
    ? [
        {
          name: "Transactions",
          url: "/dashboard/transactions",
          icon: ReceiptTextIcon,
          isActive: pathname.startsWith("/dashboard/transactions"),
        },
        {
          name: "Cashflow",
          url: "/dashboard/cashflow",
          icon: TrendingUpIcon,
          isActive: pathname.startsWith("/dashboard/cashflow"),
        },
      ]
    : [
        {
          name: "Savings Goals",
          url: "/dashboard/goals",
          icon: TargetIcon,
          isActive: pathname.startsWith("/dashboard/goals"),
        },
        {
          name: "Budgets",
          url: "/dashboard/budgets",
          icon: PiggyBankIcon,
          isActive: pathname.startsWith("/dashboard/budgets"),
        },
      ];

  return (
    <div className="px-4 sm:px-6 pt-2 pb-0.5 md:hidden animate-in fade-in-50">
      <div className="grid grid-cols-2 p-1 bg-muted/60 dark:bg-muted/30 rounded-lg border border-border/70 shadow-2xs">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.url}
              className={cn(
                "flex items-center justify-center gap-1.5 h-8 px-3 rounded-md transition-all duration-150 select-none",
                item.isActive
                  ? "bg-background text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground active:scale-98"
              )}
            >
              <Icon className={cn("size-3.5 shrink-0", item.isActive ? "text-primary" : "")} />
              <span className="text-xs font-medium tracking-tight truncate">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
