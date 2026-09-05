"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BadgeCheckIcon,
  Settings2Icon,
  SparklesIcon,
  BellIcon,
  LogOutIcon,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useMounted } from "@/hooks/use-mounted";
import { Skeleton } from "@/components/ui/skeleton";

export function NavUserMobileSkeleton() {
  return (
    <Skeleton className="size-8 rounded-full shrink-0" />
  );
}

export function NavUserMobile() {
  const { user, isLoading, logout } = useAuth();
  const mounted = useMounted();
  const router = useRouter();

  if (!mounted || isLoading || !user) {
    return <NavUserMobileSkeleton />;
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const displayName = user.name || "User";
  const displaySubtitle = user.username ? `@${user.username}` : user.email;

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full p-0 overflow-hidden outline-none cursor-pointer"
            aria-label="User profile menu"
          >
            <Avatar className="size-8">
              <AvatarImage src={user.image || undefined} alt={displayName} />
              <AvatarFallback suppressHydrationWarning>
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent
        className="w-fit min-w-56"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar>
                <AvatarImage src={user.image || undefined} alt={displayName} />
                <AvatarFallback suppressHydrationWarning>
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium" suppressHydrationWarning>
                  {displayName}
                </span>
                <span className="truncate text-xs text-muted-foreground" suppressHydrationWarning>
                  {displaySubtitle}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/dashboard/settings/account" />} className="cursor-pointer">
            <BadgeCheckIcon className="mr-2 size-4" />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/dashboard/settings/labels" />} className="cursor-pointer">
            <SparklesIcon className="mr-2 size-4" />
            Labels
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/dashboard/settings/notifications" />} className="cursor-pointer">
            <BellIcon className="mr-2 size-4" />
            Notification
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/dashboard/settings/appearance" />} className="cursor-pointer">
            <Settings2Icon className="mr-2 size-4" />
            Appearance
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
        >
          <LogOutIcon className="mr-2 size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { NavUserMobile as UserMenu, NavUserMobileSkeleton as UserMenuSkeleton };
