"use client";

import * as React from "react";
import Link from "next/link";

import { NavMain } from "@/components/nav-main";
import { NavUser, NavUserSkeleton } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  GalleryVerticalEndIcon,
  LayoutGridIcon,
  TrendingUpIcon,
  CreditCardIcon,
  ReceiptTextIcon,
  PiggyBankIcon,
  UsersIcon,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useMounted } from "@/hooks/use-mounted";

const navigationData = {
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutGridIcon />,
    },
    {
      title: "Vaults",
      url: "/dashboard/vaults",
      icon: <CreditCardIcon />,
    },
    {
      title: "Cashflow",
      url: "/dashboard/cashflow",
      icon: <TrendingUpIcon />,
    },
    {
      title: "Transactions",
      url: "/dashboard/transactions",
      icon: <ReceiptTextIcon />,
    },
    {
      title: "Budgets",
      url: "/dashboard/budgets",
      icon: <PiggyBankIcon />,
    },
    {
      title: "Socials",
      url: "/dashboard/socials",
      icon: <UsersIcon />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useAuth();
  const mounted = useMounted();

  const currentUser = {
    name: user?.name || navigationData.user.name,
    email: user?.email || navigationData.user.email,
    username: user?.username,
    avatar: user?.image || undefined,
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
              className="hover:bg-sidebar-accent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <GalleryVerticalEndIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Vaultin</span>
                <span className="truncate text-xs text-muted-foreground">Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navigationData.navMain} label="Platform" />
      </SidebarContent>

      <SidebarFooter>
        {!mounted || isLoading || !user ? (
          <NavUserSkeleton />
        ) : (
          <NavUser user={currentUser} />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
