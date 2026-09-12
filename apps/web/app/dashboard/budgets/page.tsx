"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PiggyBankIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  WalletCardsIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  SparklesIcon,
  CheckCircle2Icon,
  CoinsIcon,
} from "lucide-react";
import { BudgetCard } from "@/components/budget-card";
import { BudgetDialog } from "@/components/budget-dialog";
import { DeleteBudgetDialog } from "@/components/delete-budget-dialog";
import { BudgetExpenseDialog } from "@/components/budget-expense-dialog";
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
import { Budget, BankVault, api } from "@/lib/api";
import { getCategoryIcon } from "@/components/category-select";

function BudgetsContent() {
  const searchParams = useSearchParams();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [vaults, setVaults] = useState<BankVault[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  // Modal dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [isTxDialogOpen, setIsTxDialogOpen] = useState(false);
  const [selectedBudgetForTx, setSelectedBudgetForTx] = useState<Budget | null>(null);

  // Check URL query action for creating budget directly
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new" || action === "add" || action === "create") {
      setBudgetToEdit(null);
      setIsAddOpen(true);
    }
  }, [searchParams]);

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [budgetsRes, vaultsRes] = await Promise.all([
        api.getBudgets(),
        api.getVaults().catch(() => ({ vaults: [], summary: { totalBalance: 0, count: 0 } })),
      ]);
      setBudgets(budgetsRes.budgets || []);
      setVaults(vaultsRes.vaults || []);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while fetching budgets. Please try again later.";
      setFetchError(message);
      console.error("Failed to fetch budgets:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchBudgets();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchBudgets]);

  const handleBudgetSaved = () => {
    void fetchBudgets();
  };

  const handleBudgetDeleted = (deletedId: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== deletedId));
    void fetchBudgets();
  };

  const formatCurrency = useCallback((val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  }, []);

  // Summary statistics matching Goals
  const summary = useMemo(() => {
    const totalBudget = budgets.reduce(
      (acc, b) => acc + (b.effectiveAmount || b.amount || 0),
      0
    );
    const totalSpent = budgets.reduce((acc, b) => acc + (b.spent || 0), 0);
    const overallPercentage =
      totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const overbudgetCount = budgets.filter(
      (b) => b.status === "OVERBUDGET" || b.percentage >= 100
    ).length;
    const warningCount = budgets.filter(
      (b) =>
        b.status === "WARNING" ||
        (b.percentage >= 75 && b.percentage < 100)
    ).length;
    const onTrackCount = budgets.filter(
      (b) => b.status === "ON_TRACK" || b.percentage < 75
    ).length;

    return {
      totalBudget,
      totalSpent,
      overallPercentage,
      overbudgetCount,
      warningCount,
      onTrackCount,
    };
  }, [budgets]);

  const filteredBudgets = useMemo(() => {
    return budgets.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.categorySlug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "ALL" || b.status === filterStatus;

      const matchesCategory =
        filterCategory === "ALL" || b.categorySlug === filterCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [budgets, searchQuery, filterStatus, filterCategory]);

  return (
    <div className="@container flex flex-1 flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <PiggyBankIcon className="size-6 text-primary" />
            Budgets
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Set category spending limits and track your monthly budget in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBudgets}
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
                  New Budget
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
                      You need to create at least one vault before setting up budgets.
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
                setBudgetToEdit(null);
                setIsAddOpen(true);
              }}
              className="gap-1.5 text-xs font-semibold cursor-pointer h-9"
            >
              <PlusIcon className="size-4" />
              New Budget
            </Button>
          )}
        </div>
      </div>

      {fetchError && (
        <Alert variant="destructive" className="animate-in fade-in-50">
          <AlertCircleIcon className="size-4 shrink-0" />
          <AlertTitle className="font-semibold">Failed to load budgets</AlertTitle>
          <AlertDescription className="text-xs text-destructive/90">
            {fetchError}
          </AlertDescription>
          <AlertAction>
            <Button
              size="xs"
              variant="outline"
              onClick={fetchBudgets}
              disabled={isLoading}
              className="h-7 px-2 text-xs border-destructive/30 hover:bg-destructive/10 cursor-pointer"
            >
              <RefreshCwIcon className={`size-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Retry
            </Button>
          </AlertAction>
        </Alert>
      )}

      {/* Summary KPI Cards matching Goals */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-1 @[320px]:grid-cols-2 @[700px]:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="rounded-xl border bg-card p-3 sm:p-3.5 shadow-2xs space-y-1 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium truncate">Total Spent</span>
              <CoinsIcon className="size-3.5 text-rose-500 shrink-0" />
            </div>
            <div
              className="text-sm sm:text-base @[850px]:text-lg font-bold text-foreground font-mono truncate"
              title={formatCurrency(summary.totalSpent)}
            >
              {formatCurrency(summary.totalSpent)}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              Across all categories
            </div>
          </div>

          <div className="rounded-xl border bg-card p-3.5 shadow-2xs space-y-1 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium truncate">Total Budget</span>
              <TrendingUpIcon className="size-3.5 text-primary shrink-0" />
            </div>
            <div
              className="text-sm sm:text-base @[850px]:text-lg font-bold text-foreground font-mono truncate"
              title={formatCurrency(summary.totalBudget)}
            >
              {formatCurrency(summary.totalBudget)}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              Combined spending limit
            </div>
          </div>

          <div className="rounded-xl border bg-card p-3.5 shadow-2xs space-y-1 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium truncate">Budget Used</span>
              <SparklesIcon className="size-3.5 text-amber-500 shrink-0" />
            </div>
            <div className="text-sm sm:text-base @[850px]:text-lg font-bold text-foreground font-mono truncate">
              {summary.overallPercentage}%
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              Overall monthly usage
            </div>
          </div>

          <div className="rounded-xl border bg-card p-3.5 shadow-2xs space-y-1 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-medium truncate">Budget Health</span>
              <CheckCircle2Icon className="size-3.5 text-emerald-500 shrink-0" />
            </div>
            <div className="text-sm sm:text-base @[850px]:text-lg font-bold text-foreground font-mono truncate">
              {summary.onTrackCount}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / {budgets.length}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              {summary.warningCount + summary.overbudgetCount > 0 ? (
                <span className="text-rose-600 dark:text-rose-400 font-medium">
                  {summary.warningCount + summary.overbudgetCount} need attention
                </span>
              ) : (
                "All within safe limits"
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar: Search & Status Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search budget name or category..."
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
            { value: "ON_TRACK", label: "On Track" },
            { value: "WARNING", label: "Near Limit" },
            { value: "OVERBUDGET", label: "Over Budget" },
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
      {budgets.length > 0 && (
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
          {Array.from(new Set(budgets.map((b) => b.categorySlug))).map((catSlug) => {
            const count = budgets.filter((b) => b.categorySlug === catSlug).length;
            const CategoryIcon = getCategoryIcon(catSlug);
            return (
              <Button
                key={catSlug}
                type="button"
                size="xs"
                variant={filterCategory === catSlug ? "secondary" : "ghost"}
                onClick={() => setFilterCategory(catSlug)}
                className="rounded-md text-[11px] h-7 gap-1.5 cursor-pointer capitalize"
              >
                <CategoryIcon className="size-3" />
                <span>{catSlug.replace(/_/g, " ")}</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ({count})
                </span>
              </Button>
            );
          })}
        </div>
      )}

      {/* Budget Cards Grid or Empty State */}
      {isLoading ? (
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-full sm:w-[360px] max-w-full rounded-xl border bg-card p-4 space-y-3 shadow-xs"
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
      ) : filteredBudgets.length > 0 ? (
        <div className="flex flex-wrap gap-4">
          {filteredBudgets.map((budget) => (
            <div key={budget.id} className="w-full sm:w-[360px] max-w-full">
              <BudgetCard
                budget={budget}
                vaults={vaults}
                onAddTransaction={(b) => {
                  setSelectedBudgetForTx(b);
                  setIsTxDialogOpen(true);
                }}
                onEdit={(b) => {
                  setBudgetToEdit(b);
                  setIsAddOpen(true);
                }}
                onDelete={(b) => setBudgetToDelete(b)}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/30 p-8 text-center animate-in fade-in-50">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3 shadow-xs">
            <WalletCardsIcon className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {searchQuery || filterStatus !== "ALL" || filterCategory !== "ALL"
              ? "No matching budgets found"
              : "No Budgets Added Yet"}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {searchQuery || filterStatus !== "ALL" || filterCategory !== "ALL"
              ? "Try adjusting your search query or reset the filters."
              : "Set your first monthly spending limit to start controlling expenses for food, transport, entertainment, and more."}
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
                    Add Your First Budget
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
                        You need to create at least one vault before setting up budgets.
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
                  setBudgetToEdit(null);
                  setIsAddOpen(true);
                }}
                className="mt-4 gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <PlusIcon className="size-4" />
                Add Your First Budget
              </Button>
            )
          )}
        </div>
      )}

      {/* Add / Edit Budget Dialog */}
      <BudgetDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        budgetToEdit={budgetToEdit}
        onSuccess={handleBudgetSaved}
      />

      {/* Delete Budget Confirmation Dialog */}
      <DeleteBudgetDialog
        open={!!budgetToDelete}
        onOpenChange={(open) => {
          if (!open) setBudgetToDelete(null);
        }}
        budget={budgetToDelete}
        onSuccess={handleBudgetDeleted}
      />

      {/* Dedicated Expense Dialog for Budget (matching Goals screenshot) */}
      <BudgetExpenseDialog
        open={isTxDialogOpen}
        onOpenChange={setIsTxDialogOpen}
        vaults={vaults}
        budget={selectedBudgetForTx}
        onSuccess={() => {
          void fetchBudgets();
        }}
      />
    </div>
  );
}

export default function BudgetsPage() {
  return (
    <Suspense fallback={null}>
      <BudgetsContent />
    </Suspense>
  );
}
