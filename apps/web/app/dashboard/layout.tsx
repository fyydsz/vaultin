"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { NavUserMobile } from "@/components/nav-user-mobile";
import { MobileNav } from "@/components/mobile-nav";
import { MobileSubNav } from "@/components/mobile-sub-nav";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { GalleryVerticalEndIcon } from "lucide-react";
import { IS_PREVIEW } from "@/lib/env";
import { cn } from "@/lib/utils";
import { useEffect, Suspense } from "react";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

function VerificationStatusChecker() {
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const hasProcessedRef = React.useRef(false);

  useEffect(() => {
    const isVerified = searchParams.get("verified") === "true";
    const errorParam = searchParams.get("error");

    if (isVerified && !hasProcessedRef.current) {
      hasProcessedRef.current = true;
      refreshUser();
      toast.success("Email verified successfully! 🎉", {
        description: "Your account is now fully verified.",
      });

      // Clean up search param from URL cleanly without full reload
      const url = new URL(window.location.href);
      url.searchParams.delete("verified");
      window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
    } else if (errorParam && !hasProcessedRef.current) {
      hasProcessedRef.current = true;
      toast.error("Verification link invalid or expired", {
        description: "This link has already been used or has expired. Please request a new verification link from the banner above.",
      });

      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
    }
  }, [searchParams, refreshUser]);

  return null;
}

const routeNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/cashflow": "Cashflow",
  "/dashboard/vaults": "Vaults",
  "/dashboard/transactions": "Transactions",
  "/dashboard/budgets": "Budgets",
  "/dashboard/socials": "Socials",
  "/dashboard/socials/activity": "Activity Feed",
  "/dashboard/calendar": "Calendar",
  "/dashboard/goals": "Savings Goals",
  "/dashboard/shared-vaults": "Shared Vaults",
  "/dashboard/account": "Account Profile",
  "/dashboard/settings": "Settings",
  "/dashboard/settings/account": "User Account",
  "/dashboard/settings/labels": "Labels Settings",
  "/dashboard/settings/notifications": "Notification Settings",
  "/dashboard/settings/appearance": "Appearance Settings",
  "/dashboard/settings/delete-account": "Delete Account",
  "/dashboard/billing": "Billing",
  "/dashboard/notifications": "Notifications",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  const currentRouteName = routeNames[pathname] || "Dashboard";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground animate-pulse">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Top Header */}
        <header className={cn(
          "flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b px-4 sticky z-40 bg-background/80 backdrop-blur-md",
          IS_PREVIEW ? "top-9" : "top-0"
        )}>
          {/* Left Side: Desktop Breadcrumb vs Mobile Brand Header (No Sidebar Toggle on Mobile) */}
          <div className="flex items-center gap-2">
            {/* Desktop Navigation Header */}
            <div className="hidden md:flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-vertical:h-4 data-vertical:self-auto"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink render={<Link href="/dashboard" />}>
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {pathname !== "/dashboard" && (
                    <>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{currentRouteName}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                  {pathname === "/dashboard" && (
                    <>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Overview</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Mobile Header (Gambar 3 style: Logo Brand Icon + Page Title, No Sidebar Trigger) */}
            <div className="flex md:hidden items-center gap-2.5">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                  <GalleryVerticalEndIcon className="size-4" />
                </div>
              </Link>
              <h2 className="font-bold text-sm tracking-tight text-foreground">
                {currentRouteName}
              </h2>
            </div>
          </div>

          {/* Right Side: Mode Toggle + User Avatar Dropdown (Mobile Only) */}
          <div className="flex items-center gap-2">
            <ModeToggle />
            <div className="flex md:hidden">
              <NavUserMobile />
            </div>
          </div>
        </header>

        <Suspense fallback={null}>
          <VerificationStatusChecker />
        </Suspense>
        <EmailVerificationBanner />

        <div className="flex flex-1 flex-col pb-24 md:pb-6">
          <MobileSubNav />
          {children}
        </div>


        {/* Mobile Floating Pill Navigation (Gambar 2) */}
        <MobileNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
