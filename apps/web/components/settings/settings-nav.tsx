"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";
import { MenuIcon } from "lucide-react";

const navItems = [
  {
    title: "User account",
    href: "/dashboard/settings/account",
  },
  {
    title: "Labels",
    href: "/dashboard/settings/labels",
  },
  {
    title: "Notifications",
    href: "/dashboard/settings/notifications",
  },
  {
    title: "Appearance",
    href: "/dashboard/settings/appearance",
  },
];

const dangerItems = [
  {
    title: "Delete Account",
    href: "/dashboard/settings/delete-account",
  },
];

export function SettingsNav() {
  const router = useRouter();
  const pathname = usePathname();

  const currentHref =
    pathname === "/dashboard/settings" || pathname === "/dashboard/settings/account"
      ? "/dashboard/settings/account"
      : pathname;

  const allItems = [...navItems, ...dangerItems];
  const currentItem =
    allItems.find((item) => item.href === currentHref) || navItems[0];

  const isActive = (href: string) => {
    if (
      href === "/dashboard/settings/account" &&
      (pathname === "/dashboard/settings" || pathname === "/dashboard/settings/account")
    ) {
      return true;
    }
    return pathname === href;
  };

  return (
    <>
      {/* Mobile Dropdown Selector */}
      <div className="block md:hidden w-full">
        <Select
          value={currentHref}
          onValueChange={(val) => {
            if (val && typeof val === "string") {
              router.push(val);
            }
          }}
        >
          <SelectTrigger className="w-full h-11 px-3.5 rounded-xl bg-card border border-border/70 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors shadow-2xs">
            <div className="flex items-center gap-2.5">
              <MenuIcon className="size-4 text-muted-foreground shrink-0" />
              <span className="font-semibold text-foreground">
                {currentItem.title}
              </span>
            </div>
          </SelectTrigger>
          <SelectContent
            alignItemWithTrigger={false}
            side="bottom"
            align="start"
            sideOffset={6}
            className="w-[calc(100vw-2rem)] max-w-sm"
          >
            <SelectGroup>
              {navItems.map((item) => (
                <SelectItem
                  key={item.href}
                  value={item.href}
                  className="text-sm py-2.5"
                >
                  {item.title}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              {dangerItems.map((item) => (
                <SelectItem
                  key={item.href}
                  value={item.href}
                  className="text-sm py-2.5 text-destructive focus:text-destructive"
                >
                  {item.title}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Vertical Sidebar Navigation */}
      <nav className="hidden md:flex flex-col gap-1 w-full text-sm">
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                  active
                    ? "bg-secondary text-secondary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </div>

        <div className="my-3 border-t border-border/40" />

        <div className="flex flex-col gap-1">
          {dangerItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                  active
                    ? "bg-destructive/15 text-destructive font-semibold"
                    : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
