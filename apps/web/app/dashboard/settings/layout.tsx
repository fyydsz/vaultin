"use client";

import React from "react";
import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 space-y-6 p-6 sm:p-8 md:pl-12 lg:pl-20 xl:pl-28 max-w-6xl w-full">
      {/* Top Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and account settings
        </p>
      </div>

      {/* Main Settings Navigation + Content Layout */}
      <div className="flex flex-col gap-6 md:flex-row md:gap-14 pt-1 md:pt-2">
        {/* Left Sub-nav */}
        <aside className="w-full md:w-52 shrink-0">
          <SettingsNav />
        </aside>

        {/* Right Content View */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
