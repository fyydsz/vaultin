"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronsUpDownIcon,
  SparklesIcon,
  BadgeCheckIcon,
  Settings2Icon,
  CreditCardIcon,
  BellIcon,
  LogOutIcon,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function NavUserSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="pointer-events-none cursor-default">
          <Skeleton className="size-8 rounded-full shrink-0" />
          <div className="grid flex-1 gap-1.5 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-2.5 w-32 rounded" />
          </div>
          <ChevronsUpDownIcon className="ml-auto size-4 opacity-30 shrink-0 group-data-[collapsible=icon]:hidden" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    username?: string;
    avatar?: string;
  };
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const getInitials = (name: string) => {
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
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback suppressHydrationWarning>
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium" suppressHydrationWarning>
                {user.name}
              </span>
              <span className="truncate text-xs text-muted-foreground" suppressHydrationWarning>
                {user.username ? `@${user.username}` : user.email}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback suppressHydrationWarning>
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium" suppressHydrationWarning>
                      {user.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground" suppressHydrationWarning>
                      {user.username ? `@${user.username}` : user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/dashboard/settings/account" />}>
                <BadgeCheckIcon className="mr-2 size-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/dashboard/settings/labels" />}>
                <SparklesIcon className="mr-2 size-4" />
                Labels
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/dashboard/settings/notifications" />}>
                <BellIcon className="mr-2 size-4" />
                Notification
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/dashboard/settings/appearance" />}>
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
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
