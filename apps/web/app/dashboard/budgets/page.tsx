"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  PiggyBankIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  WalletCardsIcon,
} from "lucide-react";
import { BudgetCard } from "@/components/budget-card";
import { BudgetDialog } from "@/components/budget-dialog";
import { DeleteBudgetDialog } from "@/components/delete-budget-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
} from "@/components/ui/alert";
import { Budget, api } from "@/lib/api";

function BudgetsContent() {
  const searchParams = useSearchParams();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Modal dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

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
      const data = await api.getBudgets();
      setBudgets(data.budgets || []);
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

  const filteredBudgets = useMemo(() => {
    return budgets.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.categorySlug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "ALL" || b.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [budgets, searchQuery, filterStatus]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Top Header matching Vaults Page */}
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
        </div>
      </div>

      {fetchError && (
        <Alert variant="destructive" className="animate-in fade-in-50">
          <AlertCircleIcon className="size-4 shrink-0" />
          <AlertTitle className="font-semibold">Something went wrong</AlertTitle>
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

      {/* Budget Cards Grid or Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border bg-card p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="size-7 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-28 w-full rounded-lg" />
              <div className="flex justify-between pt-1">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredBudgets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filteredBudgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={(b) => {
                setBudgetToEdit(b);
                setIsAddOpen(true);
              }}
              onDelete={(b) => setBudgetToDelete(b)}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/30 p-8 text-center animate-in fade-in-50">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3 shadow-xs">
            <WalletCardsIcon className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {searchQuery || filterStatus !== "ALL"
              ? "No matching budgets found"
              : "No Budgets Added Yet"}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {searchQuery || filterStatus !== "ALL"
              ? "Try adjusting your search query or reset the status filter."
              : "Set your first monthly spending limit to start controlling expenses for food, transport, entertainment, and more."}
          </p>
          {!searchQuery && filterStatus === "ALL" && (
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
