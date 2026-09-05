"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutGridIcon,
  TrendingUpIcon,
  CreditCardIcon,
  ReceiptTextIcon,
  PiggyBankIcon,
  UsersIcon,
} from "lucide-react";

export const mobileNavItems = [
  {
    name: "Home",
    url: "/dashboard",
    icon: LayoutGridIcon,
  },
    {
    name: "Vaults",
    url: "/dashboard/vaults",
    icon: CreditCardIcon,
  },
  {
    name: "Cashflow",
    url: "/dashboard/cashflow",
    icon: TrendingUpIcon,
  },
  {
    name: "Transactions",
    url: "/dashboard/transactions",
    icon: ReceiptTextIcon,
  },
  {
    name: "Budget",
    url: "/dashboard/budgets",
    icon: PiggyBankIcon,
  },
  {
    name: "Socials",
    url: "/dashboard/socials",
    icon: UsersIcon,
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const navContainerRef = useRef<HTMLElement>(null);
  const activeItemRef = useRef<HTMLAnchorElement>(null);

  // Auto-scroll the active tab into the center of the mobile navigation bar
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [pathname]);

  return (
    <nav
      ref={navContainerRef}
      aria-label="Mobile navigation"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex md:hidden items-center gap-1 bg-background/85 dark:bg-card/85 backdrop-blur-xl border border-border/80 text-muted-foreground p-1.5 rounded-full shadow-lg dark:shadow-2xl max-w-[95vw] overflow-x-auto no-scrollbar ring-1 ring-border/40"
    >
      {mobileNavItems.map((item) => {
        const isActive =
          pathname === item.url ||
          (item.url !== "/dashboard" && pathname.startsWith(item.url));
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            ref={isActive ? activeItemRef : undefined}
            href={item.url}
            className={cn(
              "flex flex-col items-center justify-center min-w-[56px] py-1.5 px-2.5 rounded-full transition-all duration-200 select-none",
              isActive
                ? "bg-primary text-primary-foreground font-semibold shadow-xs scale-100"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-95"
            )}
          >
            <Icon className={cn("size-5 mb-0.5", isActive ? "stroke-2" : "stroke-1.5")} />
            <span className="text-[10px] tracking-tight leading-none">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
