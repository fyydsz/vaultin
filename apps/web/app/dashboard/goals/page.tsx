"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  TargetIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  TrendingUpIcon,
  CheckCircle2Icon,
  CoinsIcon,
} from "lucide-react";
import { GoalCard, GOAL_CATEGORY_CONFIG } from "@/components/goal-card";
import { GoalDialog } from "@/components/goal-dialog";
import { ContributeGoalDialog } from "@/components/contribute-goal-dialog";
import { WithdrawGoalDialog } from "@/components/withdraw-goal-dialog";
import { DeleteGoalDialog } from "@/components/delete-goal-dialog";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
} from "@/components/ui/alert";
import { Goal, BankVault, api } from "@/lib/api";

function GoalsContent() {
  const searchParams = useSearchParams();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [vaults, setVaults] = useState<BankVault[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  // Modal dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [goalToContribute, setGoalToContribute] = useState<Goal | null>(null);
  const [goalToWithdraw, setGoalToWithdraw] = useState<Goal | null>(null);

  // Handle URL query action for directly opening the creation dialog
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new" || action === "add" || action === "create") {
      setGoalToEdit(null);
      setIsAddOpen(true);
    }
  }, [searchParams]);

  const fetchGoalsAndVaults = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [goalsRes, vaultsRes] = await Promise.all([
        api.getGoals(),
        api.getVaults().catch(() => ({ vaults: [], summary: { totalBalance: 0, count: 0 } })),
      ]);
      setGoals(goalsRes.goals || []);
      setVaults(vaultsRes.vaults || []);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while fetching savings goals. Please try again later.";
      setFetchError(message);
      console.error("Failed to fetch goals:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchGoalsAndVaults();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchGoalsAndVaults]);

  const handleGoalSaved = () => {
    void fetchGoalsAndVaults();
  };

  const handleGoalDeleted = (deletedId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== deletedId));
    void fetchGoalsAndVaults();
  };

  const formatCurrency = useCallback((val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  }, []);

  // Summary statistics
  const summary = useMemo(() => {
    const totalTarget = goals.reduce((acc, g) => acc + (g.targetAmount || 0), 0);
    const totalSaved = goals.reduce((acc, g) => acc + (g.currentAmount || 0), 0);
    const overallPercentage =
      totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
    const completedCount = goals.filter(
      (g) => g.status === "completed" || g.currentAmount >= g.targetAmount
    ).length;
    const activeCount = goals.length - completedCount;

    return {
      totalTarget,
      totalSaved,
      overallPercentage,
      completedCount,
      activeCount,
    };
  }, [goals]);

  // Filtered goals
  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      const matchesSearch =
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const isCompleted =
        g.status === "completed" || g.currentAmount >= g.targetAmount;

      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "ACTIVE" && !isCompleted && g.status !== "cancelled") ||
        (filterStatus === "COMPLETED" && isCompleted);

      const matchesCategory =
        filterCategory === "ALL" || g.category === filterCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [goals, searchQuery, filterStatus, filterCategory]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <TargetIcon className="size-6 text-primary" />
            Savings Goals
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Set aside money for what matters, track milestones, and build your wealth.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchGoalsAndVaults}
            disabled={isLoading}
            className="gap-1.5 text-xs cursor-pointer h-9"
          >
            <RefreshCwIcon
              className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {vaults.length === 0 ? (
            <HoverCard>
              <HoverCardTrigger
                delay={200}
                closeDelay={150}
                render={
                  <span
                    className="inline-block cursor-not-allowed"
                    tabIndex={0}
                  />
                }
              >
                <Button
                  disabled
                  size="sm"
                  className="gap-1.5 text-xs font-semibold h-9 pointer-events-none"
                >
                  <PlusIcon className="size-4" />
                  New Goal
                </Button>
              </HoverCardTrigger>
              <HoverCardContent side="bottom" align="end" className="w-72 p-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <AlertCircleIcon className="size-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-foreground">
                      Vault Required
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      You need to create at least one vault before setting up savings goals.
                    </p>
                    <Link
                      href="/dashboard/vaults?action=new"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline pt-0.5"
                    >
                      <span>Create a vault</span>
                      <ArrowRightIcon className="size-3" />
                    </Link>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setGoalToEdit(null);
                setIsAddOpen(true);
              }}
              className="gap-1.5 text-xs font-semibold cursor-pointer h-9"
            >
              <PlusIcon className="size-4" />
              New Goal
            </Button>
          )}
        </div>
      </div>

      {fetchError && (
        <Alert variant="destructive" className="animate-in fade-in-50">
          <AlertCircleIcon className="size-4 shrink-0" />
          <AlertTitle className="font-semibold">Failed to load savings goals</AlertTitle>
          <AlertDescription className="text-xs text-destructive/90">
            {fetchError}
          </AlertDescription>
          <AlertAction>
            <Button
              size="xs"
              variant="outline"
              onClick={fetchGoalsAndVaults}
              disabled={isLoading}
              className="h-7 px-2 text-xs border-destructive/30 hover:bg-destructive/10 cursor-pointer"
            >
              <RefreshCwIcon className={`size-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Retry
            </Button>
          </AlertAction>
        </Alert>
      )}

      {/* Summary KPI Cards */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border bg-card p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium">Total Saved</span>
              <CoinsIcon className="size-3.5 text-emerald-500" />
            </div>
            <div className="text-lg font-bold tracking-tight text-foreground font-mono">
              {formatCurrency(summary.totalSaved)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Accumulated in goals
            </div>
          </div>

          <div className="rounded-xl border bg-card p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium">Total Target</span>
              <TrendingUpIcon className="size-3.5 text-primary" />
            </div>
            <div className="text-lg font-bold tracking-tight text-foreground font-mono">
              {formatCurrency(summary.totalTarget)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Across all milestones
            </div>
          </div>

          <div className="rounded-xl border bg-card p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium">Progress</span>
              <SparklesIcon className="size-3.5 text-amber-500" />
            </div>
            <div className="text-lg font-bold tracking-tight text-foreground font-mono">
              {summary.overallPercentage}%
            </div>
            <div className="text-[10px] text-muted-foreground">
              Overall completion
            </div>
          </div>

          <div className="rounded-xl border bg-card p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium">Milestones</span>
              <CheckCircle2Icon className="size-3.5 text-primary" />
            </div>
            <div className="text-lg font-bold tracking-tight text-foreground font-mono">
              {summary.completedCount} <span className="text-xs font-normal text-muted-foreground">/ {goals.length}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {summary.activeCount} active in progress
            </div>
          </div>
        </div>
      )}

      {/* Toolbar: Search & Status Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search goal name, category, or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs bg-card/60 border-border/80 focus-visible:ring-1"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Clear search"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { value: "ALL", label: "All" },
            { value: "ACTIVE", label: "Active" },
            { value: "COMPLETED", label: "Completed" },
          ].map((tab) => (
            <Button
              key={tab.value}
              type="button"
              size="sm"
              variant={filterStatus === tab.value ? "default" : "outline"}
              onClick={() => setFilterStatus(tab.value)}
              className={`rounded-full px-3.5 h-8 text-xs font-medium transition-colors cursor-pointer ${
                filterStatus === tab.value
                  ? "border-primary bg-primary text-primary-foreground shadow-2xs font-semibold"
                  : "border-border bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Category Pills Filter */}
      {goals.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Button
            type="button"
            size="xs"
            variant={filterCategory === "ALL" ? "secondary" : "ghost"}
            onClick={() => setFilterCategory("ALL")}
            className="rounded-md text-[11px] h-7 cursor-pointer"
          >
            All Categories
          </Button>
          {Object.entries(GOAL_CATEGORY_CONFIG).map(([catKey, catMeta]) => {
            const count = goals.filter((g) => g.category === catKey).length;
            if (count === 0 && filterCategory !== catKey) return null;
            return (
              <Button
                key={catKey}
                type="button"
                size="xs"
                variant={filterCategory === catKey ? "secondary" : "ghost"}
                onClick={() => setFilterCategory(catKey)}
                className="rounded-md text-[11px] h-7 gap-1 cursor-pointer"
              >
                <span>{catMeta.defaultIcon}</span>
                <span>{catMeta.label}</span>
                {count > 0 && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ({count})
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      )}

      {/* Goals Grid or Loading / Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border bg-card p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-9 rounded-lg" />
                  <Skeleton className="h-5 w-28" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between pt-1">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              vaults={vaults}
              onContribute={(g) => setGoalToContribute(g)}
              onWithdraw={(g) => setGoalToWithdraw(g)}
              onEdit={(g) => {
                setGoalToEdit(g);
                setIsAddOpen(true);
              }}
              onDelete={(g) => setGoalToDelete(g)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/30 p-8 text-center animate-in fade-in-50">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3 shadow-xs">
            <TargetIcon className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {searchQuery || filterStatus !== "ALL" || filterCategory !== "ALL"
              ? "No matching goals found"
              : "No Savings Goals Yet"}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {searchQuery || filterStatus !== "ALL" || filterCategory !== "ALL"
              ? "Try adjusting your search query or reset the filters."
              : "Start saving for emergency funds, tech gadgets, holiday trips, or personal milestones."}
          </p>
          {!searchQuery && filterStatus === "ALL" && filterCategory === "ALL" && (
            vaults.length === 0 ? (
              <HoverCard>
                <HoverCardTrigger
                  delay={200}
                  closeDelay={150}
                  render={
                    <span
                      className="inline-block cursor-not-allowed mt-4"
                      tabIndex={0}
                    />
                  }
                >
                  <Button
                    disabled
                    size="sm"
                    className="gap-1.5 text-xs font-semibold pointer-events-none"
                  >
                    <PlusIcon className="size-4" />
                    Create Your First Goal
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent side="top" align="center" className="w-72 p-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <AlertCircleIcon className="size-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-foreground">
                        Vault Required
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        You need to create at least one vault before setting up savings goals.
                      </p>
                      <Link
                        href="/dashboard/vaults?action=new"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline pt-0.5"
                      >
                        <span>Create a vault</span>
                        <ArrowRightIcon className="size-3" />
                      </Link>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setGoalToEdit(null);
                  setIsAddOpen(true);
                }}
                className="mt-4 gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <PlusIcon className="size-4" />
                Create Your First Goal
              </Button>
            )
          )}
        </div>
      )}

      {/* Add / Edit Goal Dialog */}
      <GoalDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        goalToEdit={goalToEdit}
        onSuccess={handleGoalSaved}
      />

      {/* Contribute / Deposit Savings Dialog */}
      <ContributeGoalDialog
        open={!!goalToContribute}
        onOpenChange={(open) => {
          if (!open) setGoalToContribute(null);
        }}
        goal={goalToContribute}
        vaults={vaults}
        onSuccess={() => {
          void fetchGoalsAndVaults();
        }}
      />

      {/* Withdraw Savings Dialog */}
      <WithdrawGoalDialog
        open={!!goalToWithdraw}
        onOpenChange={(open) => {
          if (!open) setGoalToWithdraw(null);
        }}
        goal={goalToWithdraw}
        vaults={vaults}
        onSuccess={() => {
          void fetchGoalsAndVaults();
        }}
      />

      {/* Delete Goal Confirmation Dialog */}
      <DeleteGoalDialog
        open={!!goalToDelete}
        onOpenChange={(open) => {
          if (!open) setGoalToDelete(null);
        }}
        goal={goalToDelete}
        vaults={vaults}
        onSuccess={handleGoalDeleted}
      />
    </div>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={null}>
      <GoalsContent />
    </Suspense>
  );
}
