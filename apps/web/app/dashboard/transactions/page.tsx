"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useMounted } from "@/hooks/use-mounted";
import {
  ReceiptTextIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ActivityIcon,
  AlertCircleIcon,
  ArrowRightIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TransactionFilterPopover,
  type TransactionFilters,
} from "@/components/transaction-filter-popover";
import { TransactionsTable } from "@/components/transactions-table";
import { TransactionDialog } from "@/components/transaction-dialog";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { BankVault, Transaction, Budget, api } from "@/lib/api";
import { useCategoryStore } from "@/stores/category-store";
import { useLabelStore } from "@/stores/label-store";

const INITIAL_FILTERS: TransactionFilters = {
  search: "",
  startDate: "",
  endDate: "",
  minAmount: "",
  maxAmount: "",
  categories: [],
  labels: [],
  accountIds: [],
};

export default function TransactionsPage() {
  const { user } = useAuth();
  const mounted = useMounted();

  const [vaults, setVaults] = useState<BankVault[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [filters, setFilters] = useState<TransactionFilters>(INITIAL_FILTERS);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);

  const { categories, fetchCategories } = useCategoryStore();
  const { labels, fetchLabels } = useLabelStore();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vaultsRes, txRes, budgetsRes] = await Promise.all([
        api.getVaults().catch(() => ({ vaults: [], summary: { totalBalance: 0, count: 0 } })),
        api
          .getTransactions({ limit: 500 })
          .catch(() => ({
            transactions: [],
            pagination: { page: 1, limit: 500, total: 0, totalPages: 1 },
          })),
        api.getBudgets().catch(() => ({ budgets: [] })),
      ]);
      setVaults(vaultsRes.vaults || []);
      setTransactions(txRes.transactions || []);
      setBudgets(budgetsRes.budgets || []);
    } catch (err) {
      console.error("Failed to load transactions data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchLabels();
    const timer = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData, fetchCategories, fetchLabels]);

  const handleFilterChange = (partial: Partial<TransactionFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.startDate || filters.endDate) count++;
    if (filters.minAmount || filters.maxAmount) count++;
    if (filters.categories.length > 0) count++;
    if (filters.labels.length > 0) count++;
    if (filters.accountIds.length > 0) count++;
    return count;
  }, [filters]);

  const hasAnyFilterActive = useMemo(() => {
    return (
      activeFilterCount > 0 ||
      filters.search.trim().length > 0 ||
      !!filters.startDate ||
      !!filters.endDate ||
      !!filters.minAmount ||
      !!filters.maxAmount ||
      filters.categories.length > 0 ||
      filters.labels.length > 0 ||
      filters.accountIds.length > 0
    );
  }, [activeFilterCount, filters]);

  // Client-side filtering and sorting for instant response
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Search filter: description or notes
        if (filters.search.trim()) {
          const q = filters.search.toLowerCase().trim();
          const matchDesc = tx.description?.toLowerCase().includes(q);
          const matchNotes = tx.notes?.toLowerCase().includes(q);
          if (!matchDesc && !matchNotes) return false;
        }

        // Account / Vault filter (matches any of the selected account IDs)
        if (filters.accountIds.length > 0) {
          if (!filters.accountIds.includes(tx.accountId)) return false;
        }

        // Category filter (matches any of the selected category slugs/ids)
        if (filters.categories.length > 0) {
          if (!filters.categories.includes(tx.category)) return false;
        }

        // Label filter (matches any of the selected labels)
        if (filters.labels.length > 0) {
          const hasMatchingLabel = tx.labels?.some((txLbl) =>
            filters.labels.some(
              (fLbl) => fLbl.toLowerCase() === txLbl.toLowerCase()
            )
          );
          if (!hasMatchingLabel) return false;
        }

        // Date range filter
        if (filters.startDate) {
          const txTime = new Date(tx.date).getTime();
          const startTime = new Date(filters.startDate + "T00:00:00").getTime();
          if (txTime < startTime) return false;
        }

        if (filters.endDate) {
          const txTime = new Date(tx.date).getTime();
          const endTime = new Date(filters.endDate + "T23:59:59.999").getTime();
          if (txTime > endTime) return false;
        }

        // Amount filter (comparing absolute amount)
        const absAmt = Math.abs(tx.amount);
        if (filters.minAmount) {
          const min = parseFloat(filters.minAmount);
          if (!isNaN(min) && absAmt < min) return false;
        }
        if (filters.maxAmount) {
          const max = parseFloat(filters.maxAmount);
          if (!isNaN(max) && absAmt > max) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
      });
  }, [transactions, filters, sortOrder]);

  // Metric summaries based on the currently filtered transactions
  const { totalInflow, totalOutflow, netMovement } = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    for (const tx of filteredTransactions) {
      const amt = Math.abs(tx.amount);
      if (tx.amount > 0 || tx.type === "INCOME") {
        inflow += amt;
      } else {
        outflow += amt;
      }
    }
    return {
      totalInflow: inflow,
      totalOutflow: outflow,
      netMovement: inflow - outflow,
    };
  }, [filteredTransactions]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getCategoryLabel = (slug: string) => {
    const found = categories.find((c) => c.slug === slug || c.id === slug);
    return found?.name || slug.replace(/_/g, " ");
  };

  const getAccountLabel = (id: string) => {
    const found = vaults.find((v) => v.id === id);
    return found?.name || "Account";
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ReceiptTextIcon className="size-6 text-primary" />
            Transactions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Search, filter, and review all your income and expense records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
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
                  New Transaction
                </Button>
              </HoverCardTrigger>
              <HoverCardContent side="bottom" align="end" className="w-72 p-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <AlertCircleIcon className="size-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-foreground">
                      Vault Required
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      You need to create at least one vault before recording transactions.
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
                setTxToEdit(null);
                setIsDialogOpen(true);
              }}
              className="gap-1.5 text-xs font-semibold cursor-pointer h-9"
            >
              <PlusIcon className="size-4" />
              New Transaction
            </Button>
          )}
        </div>
      </div>

      {/* DISABLED */}
      {false && (
        <>
          {/* Summary Metrics Bar */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
            {/* Total Movements */}
            <div className="flex flex-col justify-between rounded-lg sm:rounded-xl border border-border/80 bg-card p-2.5 sm:p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                  Total Recorded
                </span>
                <div className="flex size-5.5 sm:size-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                  <ReceiptTextIcon className="size-3 sm:size-3.5" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 font-mono text-sm sm:text-xl font-bold text-foreground truncate">
                {isLoading ? (
                  <Skeleton className="h-5 sm:h-6 w-14 sm:w-16" />
                ) : (
                  `${filteredTransactions.length} items`
                )}
              </div>
            </div>

            {/* Total Inflow */}
            <div className="flex flex-col justify-between rounded-lg sm:rounded-xl border border-border/80 bg-card p-2.5 sm:p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                  Total Inflow
                </span>
                <div className="flex size-5.5 sm:size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <TrendingUpIcon className="size-3 sm:size-3.5" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 font-mono text-sm sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
                {isLoading ? (
                  <Skeleton className="h-5 sm:h-6 w-20 sm:w-28" />
                ) : (
                  `+${formatCurrency(totalInflow)}`
                )}
              </div>
            </div>

            {/* Total Outflow */}
            <div className="flex flex-col justify-between rounded-lg sm:rounded-xl border border-border/80 bg-card p-2.5 sm:p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                  Total Outflow
                </span>
                <div className="flex size-5.5 sm:size-7 items-center justify-center rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                  <TrendingDownIcon className="size-3 sm:size-3.5" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 font-mono text-sm sm:text-xl font-bold text-rose-600 dark:text-rose-400 truncate">
                {isLoading ? (
                  <Skeleton className="h-5 sm:h-6 w-20 sm:w-28" />
                ) : (
                  `-${formatCurrency(totalOutflow)}`
                )}
              </div>
            </div>

            {/* Net Flow */}
            <div className="flex flex-col justify-between rounded-lg sm:rounded-xl border border-border/80 bg-card p-2.5 sm:p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                  Net Flow
                </span>
                <div className="flex size-5.5 sm:size-7 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                  <ActivityIcon className="size-3 sm:size-3.5" />
                </div>
              </div>
              <div
                className={`mt-1 sm:mt-2 font-mono text-sm sm:text-xl font-bold truncate ${netMovement >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
                  }`}
              >
                {isLoading ? (
                  <Skeleton className="h-5 sm:h-6 w-20 sm:w-28" />
                ) : (
                  `${netMovement >= 0 ? "+" : "-"}${formatCurrency(
                    Math.abs(netMovement)
                  )}`
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Filter & Search Toolbar (Matching user mockup layout) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {/* Filters Button with Popover */}
          <TransactionFilterPopover
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            vaults={vaults}
            activeFilterCount={activeFilterCount}
          />

          {/* Search Input matching the user mockup placeholder */}
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search description or notes..."
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="pl-9 pr-8 h-9 text-xs bg-card/60 border-border/80 focus-visible:ring-1"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => handleFilterChange({ search: "" })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Clear search"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {hasAnyFilterActive && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1">
              Active filters:
            </span>

            {/* Search Query Chip */}
            {filters.search.trim() && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 border border-border/80 px-2 py-0.5 text-[11px] text-foreground font-medium">
                <span>Search: &quot;{filters.search}&quot;</span>
                <button
                  type="button"
                  onClick={() => handleFilterChange({ search: "" })}
                  className="hover:text-destructive cursor-pointer"
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            )}

            {/* Date Range Chip */}
            {(filters.startDate || filters.endDate) && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 border border-border/80 px-2 py-0.5 text-[11px] text-foreground font-medium">
                <span>
                  Date: {filters.startDate || "Any"} → {filters.endDate || "Any"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleFilterChange({ startDate: "", endDate: "" })
                  }
                  className="hover:text-destructive cursor-pointer"
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            )}

            {/* Amount Range Chip */}
            {(filters.minAmount || filters.maxAmount) && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 border border-border/80 px-2 py-0.5 text-[11px] text-foreground font-medium">
                <span>
                  Amount:{" "}
                  {filters.minAmount
                    ? `≥ ${formatCurrency(parseFloat(filters.minAmount))}`
                    : ""}
                  {filters.minAmount && filters.maxAmount ? " and " : ""}
                  {filters.maxAmount
                    ? `≤ ${formatCurrency(parseFloat(filters.maxAmount))}`
                    : ""}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleFilterChange({ minAmount: "", maxAmount: "" })
                  }
                  className="hover:text-destructive cursor-pointer"
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            )}

            {/* Categories Chips */}
            {filters.categories.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 border border-border/80 px-2 py-0.5 text-[11px] text-foreground font-medium">
                <span>
                  Categories ({filters.categories.length}):{" "}
                  {filters.categories.map((c) => getCategoryLabel(c)).join(", ")}
                </span>
                <button
                  type="button"
                  onClick={() => handleFilterChange({ categories: [] })}
                  className="hover:text-destructive cursor-pointer"
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            )}

            {/* Labels Chips */}
            {filters.labels.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 border border-border/80 px-2 py-0.5 text-[11px] text-foreground font-medium">
                <span>
                  Labels ({filters.labels.length}):{" "}
                  {filters.labels.map((l) => `#${l}`).join(", ")}
                </span>
                <button
                  type="button"
                  onClick={() => handleFilterChange({ labels: [] })}
                  className="hover:text-destructive cursor-pointer"
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            )}

            {/* Accounts Chips */}
            {filters.accountIds.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 border border-border/80 px-2 py-0.5 text-[11px] text-foreground font-medium">
                <span>
                  Accounts ({filters.accountIds.length}):{" "}
                  {filters.accountIds.map((a) => getAccountLabel(a)).join(", ")}
                </span>
                <button
                  type="button"
                  onClick={() => handleFilterChange({ accountIds: [] })}
                  className="hover:text-destructive cursor-pointer"
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            )}

            {/* Clear All Link */}
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleResetFilters}
              className="text-[11px] h-6 px-2 text-destructive hover:bg-destructive/10 cursor-pointer ml-1"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <TransactionsTable
        transactions={filteredTransactions}
        vaults={vaults}
        isLoading={isLoading}
        sortOrder={sortOrder}
        onToggleSort={() =>
          setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
        }
        hasActiveFilters={hasAnyFilterActive}
        onClearFilters={handleResetFilters}
        onEditTransaction={(tx) => {
          setTxToEdit(tx);
          setIsDialogOpen(true);
        }}
        onTransactionDeleted={() => {
          fetchData();
        }}
        onTransactionUpdated={() => {
          fetchData();
        }}
      />

      {/* Create / Edit Transaction Modal Dialog */}
      <TransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        vaults={vaults}
        budgets={budgets}
        transactionToEdit={txToEdit}
        onSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
}
