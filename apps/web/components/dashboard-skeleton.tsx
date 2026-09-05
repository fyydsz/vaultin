"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ContentSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="flex flex-col gap-3 rounded-2xl border p-6 bg-card/40">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-4 w-full max-w-md rounded" />
      </div>

      {/* 3 Stats Cards Skeleton */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="flex flex-col justify-between rounded-xl border p-5 bg-card/40 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-7 w-36 rounded" />
            <Skeleton className="h-3.5 w-28 rounded" />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border p-5 bg-card/40 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-7 w-36 rounded" />
            <Skeleton className="h-3.5 w-32 rounded" />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border p-5 bg-card/40 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-7 w-32 rounded" />
            <Skeleton className="h-3.5 w-24 rounded" />
          </div>
        </div>
      </div>

      {/* Main Body Area Skeleton */}
      <div className="min-h-[360px] flex-1 rounded-xl border p-6 bg-card/30 flex flex-col justify-center items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="h-5 w-48 rounded" />
        <Skeleton className="h-4 w-64 rounded" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return <ContentSkeleton />;
}
