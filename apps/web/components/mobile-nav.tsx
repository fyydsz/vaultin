"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutGridIcon,
  CreditCardIcon,
  ReceiptTextIcon,
  TargetIcon,
  UsersIcon,
} from "lucide-react";

export const mobileNavItems = [
  {
    name: "Home",
    url: "/dashboard",
    icon: LayoutGridIcon,
    isActive: (pathname: string) => pathname === "/dashboard",
  },
  {
    name: "Vaults",
    url: "/dashboard/vaults",
    icon: CreditCardIcon,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/vaults"),
  },
  {
    name: "Activity",
    url: "/dashboard/transactions",
    icon: ReceiptTextIcon,
    isActive: (pathname: string) =>
      pathname.startsWith("/dashboard/transactions") ||
      pathname.startsWith("/dashboard/cashflow"),
  },
  {
    name: "Planning",
    url: "/dashboard/goals",
    icon: TargetIcon,
    isActive: (pathname: string) =>
      pathname.startsWith("/dashboard/goals") ||
      pathname.startsWith("/dashboard/budgets"),
  },
  {
    name: "Socials",
    url: "/dashboard/socials",
    icon: UsersIcon,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/socials"),
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex md:hidden items-center justify-between gap-1 bg-background/90 dark:bg-card/90 backdrop-blur-xl border border-border/80 text-muted-foreground p-1.5 rounded-full shadow-lg dark:shadow-2xl w-[calc(100%-1.5rem)] max-w-md ring-1 ring-border/40"
    >
      {mobileNavItems.map((item) => {
        const isActive = item.isActive(pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.url}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-full transition-all duration-200 select-none min-w-0",
              isActive
                ? "bg-primary text-primary-foreground font-semibold shadow-xs scale-100"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-95"
            )}
          >
            <Icon className={cn("size-4.5 mb-0.5 shrink-0", isActive ? "stroke-2" : "stroke-1.5")} />
            <span className="text-[10px] tracking-tight leading-none truncate max-w-full">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
