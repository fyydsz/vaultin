"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useMounted } from "@/hooks/use-mounted";
import {
  WalletIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ActivityIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Building2Icon,
  PlusIcon,
  RefreshCwIcon,
  LayersIcon,
  ArrowRightIcon,
  ReceiptTextIcon,
  PieChartIcon,
  BanknoteIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartBarStacked } from "@/components/ui/chart-bar-stacked";
import { type ChartConfig } from "@/components/ui/chart";
import { BankVault, Transaction, api } from "@/lib/api";
import { useCategoryStore } from "@/stores/category-store";
import { getCategoryIcon } from "@/components/category-select";
import { TransactionDialog } from "@/components/transaction-dialog";
import { VaultDialog } from "@/components/vault-dialog";

export type Granularity = "daily" | "monthly";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const PALETTE_FALLBACKS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#8B5CF6", // purple
  "#F59E0B", // amber
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
  "#14B8A6", // teal
];

export default function DashboardOverviewPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const mounted = useMounted();

  const [vaults, setVaults] = useState<BankVault[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [isTxDialogOpen, setIsTxDialogOpen] = useState(false);
  const [isVaultDialogOpen, setIsVaultDialogOpen] = useState(false);

  // Granularity & Date Navigator State (Daily & Monthly)
  const [period, setPeriod] = useState<Granularity>("monthly");
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());

  const { categories, fetchCategories } = useCategoryStore();

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vaultsRes, txRes] = await Promise.all([
        api.getVaults().catch(() => ({ vaults: [], summary: { totalBalance: 0, count: 0 } })),
        api.getTransactions({ limit: 500 }).catch(() => ({
          transactions: [],
          pagination: { page: 1, limit: 500, total: 0, totalPages: 1 },
        })),
      ]);
      setVaults(vaultsRes.vaults || []);
      setTransactions(txRes.transactions || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    const timer = window.setTimeout(() => {
      void fetchDashboardData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchDashboardData, fetchCategories]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const getProviderIcon = (providerType?: string) => {
    switch (providerType) {
      case "BANK":
        return <Building2Icon className="size-3.5" />;
      case "E_WALLET":
        return <WalletIcon className="size-3.5" />;
      case "CASH":
        return <BanknoteIcon className="size-3.5" />;
      default:
        return <WalletIcon className="size-3.5" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  // Total Combined Net Worth
  const totalNetWorth = useMemo(() => {
    return vaults.reduce((acc, v) => acc + (v.balance || 0), 0);
  }, [vaults]);

  // Date Navigator Previous / Next handlers
  const handlePrevDate = () => {
    setAnchorDate((prev) => {
      const next = new Date(prev);
      if (period === "daily") {
        next.setMonth(next.getMonth() - 1);
      } else if (period === "monthly") {
        next.setFullYear(next.getFullYear() - 1);
      }
      return next;
    });
  };

  const handleNextDate = () => {
    setAnchorDate((prev) => {
      const next = new Date(prev);
      if (period === "daily") {
        next.setMonth(next.getMonth() + 1);
      } else if (period === "monthly") {
        next.setFullYear(next.getFullYear() + 1);
      }
      return next;
    });
  };

  // Date Navigator Label (Year for monthly, Month Year for daily)
  const dateNavigatorLabel = useMemo(() => {
    const y = anchorDate.getFullYear();
    const m = anchorDate.getMonth();

    if (period === "monthly") {
      return `${y}`;
    }
    return `${MONTH_NAMES[m]} ${y}`;
  }, [period, anchorDate]);

  // Dynamic Multi-Vault Stacked Time Series
  const {
    chartData,
    chartConfig,
    vaultBars,
    periodTotalIncome,
    periodTotalExpense,
    periodNet,
    periodEndingNetWorth,
  } = useMemo(() => {
    const now = new Date();
    const nowTimestamp = now.getTime();

    // Normalizing transactions with timestamp
    const parsedTxs = transactions.map((tx) => {
      const d = new Date(tx.date);
      const amt = Math.abs(tx.amount);
      const isInc = tx.type === "INCOME" || tx.amount > 0;
      return {
        ...tx,
        parsedDate: d,
        timestamp: d.getTime(),
        netDelta: isInc ? amt : -amt,
        incomeAmt: isInc ? amt : 0,
        expenseAmt: isInc ? 0 : amt,
      };
    });

    // Construct ChartConfig & Stacked Bars mapping per vault
    const config: ChartConfig = {};
    const bars: Array<{
      key: string;
      label: string;
      color: string;
      stackId: string;
    }> = [];

    vaults.forEach((v, idx) => {
      const vColor = v.color || PALETTE_FALLBACKS[idx % PALETTE_FALLBACKS.length];
      config[v.id] = {
        label: v.name,
        color: vColor,
      };
      bars.push({
        key: v.id,
        label: v.name,
        color: vColor,
        stackId: "networth",
      });
    });

    // Helper: calculate balance of a single vault at timestamp T
    const getVaultBalanceAtTime = (v: BankVault, timestamp: number) => {
      const vaultCreatedDayStart = v.createdAt
        ? new Date(new Date(v.createdAt).setHours(0, 0, 0, 0)).getTime()
        : new Date(new Date().setHours(0, 0, 0, 0)).getTime();

      const vaultTxs = parsedTxs.filter((tx) => tx.accountId === v.id);
      const earliestTxTime =
        vaultTxs.length > 0
          ? Math.min(
              ...vaultTxs.map((tx) =>
                new Date(new Date(tx.timestamp).setHours(0, 0, 0, 0)).getTime()
              )
            )
          : vaultCreatedDayStart;

      const earliestKnownTime = Math.min(vaultCreatedDayStart, earliestTxTime);

      if (timestamp < earliestKnownTime) {
        return 0;
      }

      let subsequentDelta = 0;
      for (const tx of vaultTxs) {
        if (tx.timestamp > timestamp) {
          subsequentDelta += tx.netDelta;
        }
      }
      return (v.balance || 0) - subsequentDelta;
    };

    const anchorYear = anchorDate.getFullYear();
    const anchorMonth = anchorDate.getMonth();

    const points: Array<Record<string, any>> = [];

    if (period === "daily") {
      const daysInMonth = new Date(anchorYear, anchorMonth + 1, 0).getDate();

      for (let d = 1; d <= daysInMonth; d++) {
        const dayStart = new Date(anchorYear, anchorMonth, d, 0, 0, 0, 0).getTime();
        const dayEnd = new Date(anchorYear, anchorMonth, d, 23, 59, 59, 999).getTime();

        const isFuture = dayStart > nowTimestamp;

        let dayIncome = 0;
        let dayExpense = 0;
        const pt: Record<string, any> = {
          shortDate: `${d} ${MONTH_NAMES_SHORT[anchorMonth]}`,
          fullDate: `${d} ${MONTH_NAMES[anchorMonth]} ${anchorYear}`,
          totalBalance: 0,
          isFuture,
        };

        if (!isFuture) {
          for (const tx of parsedTxs) {
            if (tx.timestamp >= dayStart && tx.timestamp <= dayEnd) {
              dayIncome += tx.incomeAmt;
              dayExpense += tx.expenseAmt;
            }
          }

          let combinedBal = 0;
          for (const v of vaults) {
            const bal = getVaultBalanceAtTime(v, Math.min(dayEnd, nowTimestamp));
            pt[v.id] = Math.max(0, bal);
            combinedBal += Math.max(0, bal);
          }
          pt.totalBalance = combinedBal;
        } else {
          for (const v of vaults) {
            pt[v.id] = 0;
          }
          pt.totalBalance = 0;
        }

        pt.income = dayIncome;
        pt.expense = dayExpense;
        pt.net = dayIncome - dayExpense;
        points.push(pt);
      }
    } else if (period === "monthly") {
      for (let m = 0; m < 12; m++) {
        const monthStart = new Date(anchorYear, m, 1, 0, 0, 0, 0).getTime();
        const monthEnd = new Date(anchorYear, m + 1, 0, 23, 59, 59, 999).getTime();

        const isFuture = monthStart > nowTimestamp;

        let mIncome = 0;
        let mExpense = 0;
        const pt: Record<string, any> = {
          shortDate: MONTH_NAMES_SHORT[m],
          fullDate: `${MONTH_NAMES[m]} ${anchorYear}`,
          totalBalance: 0,
          isFuture,
        };

        if (!isFuture) {
          for (const tx of parsedTxs) {
            if (tx.timestamp >= monthStart && tx.timestamp <= monthEnd) {
              mIncome += tx.incomeAmt;
              mExpense += tx.expenseAmt;
            }
          }

          let combinedBal = 0;
          for (const v of vaults) {
            const bal = getVaultBalanceAtTime(v, Math.min(monthEnd, nowTimestamp));
            pt[v.id] = Math.max(0, bal);
            combinedBal += Math.max(0, bal);
          }
          pt.totalBalance = combinedBal;
        } else {
          for (const v of vaults) {
            pt[v.id] = 0;
          }
          pt.totalBalance = 0;
        }

        pt.income = mIncome;
        pt.expense = mExpense;
        pt.net = mIncome - mExpense;
        points.push(pt);
      }
    }

    const pastOrCurrentPoints = points.filter((p) => !p.isFuture);
    let totalInc = 0;
    let totalExp = 0;
    for (const p of pastOrCurrentPoints) {
      totalInc += p.income || 0;
      totalExp += p.expense || 0;
    }
    const netMov = totalInc - totalExp;
    const endBal =
      pastOrCurrentPoints.length > 0
        ? pastOrCurrentPoints[pastOrCurrentPoints.length - 1].totalBalance
        : totalNetWorth;

    return {
      chartData: points,
      chartConfig: config,
      vaultBars: bars,
      periodTotalIncome: totalInc,
      periodTotalExpense: totalExp,
      periodNet: netMov,
      periodEndingNetWorth: endBal,
    };
  }, [vaults, transactions, period, anchorDate, totalNetWorth]);

  // Current Month Totals for Top Cards
  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const start = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0).getTime();
    const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999).getTime();

    let mInflow = 0;
    let mOutflow = 0;

    for (const tx of transactions) {
      const tTime = new Date(tx.date).getTime();
      if (tTime >= start && tTime <= end) {
        const amt = Math.abs(tx.amount);
        if (tx.type === "INCOME" || tx.amount > 0) {
          mInflow += amt;
        } else {
          mOutflow += amt;
        }
      }
    }

    const net = mInflow - mOutflow;
    const rate = mInflow > 0 ? Math.round((net / mInflow) * 100) : 0;

    return {
      inflow: mInflow,
      outflow: mOutflow,
      net,
      savingsRate: rate,
      totalSpent: mOutflow,
    };
  }, [transactions]);

  // Top 4 Recent Transactions for the 3-column card
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [transactions]);

  // Top Spending Categories of the Current Month
  const currentMonthTopCategories = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const start = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0).getTime();
    const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999).getTime();

    const map = new Map<string, number>();
    let totalMonthExpense = 0;

    for (const tx of transactions) {
      const tTime = new Date(tx.date).getTime();
      if (tTime >= start && tTime <= end && (tx.type === "EXPENSE" || tx.amount < 0)) {
        const amt = Math.abs(tx.amount);
        const cat = tx.category || "other_expense";
        map.set(cat, (map.get(cat) || 0) + amt);
        totalMonthExpense += amt;
      }
    }

    return Array.from(map.entries())
      .map(([slug, amt]) => {
        const catMeta = categories.find((c) => c.slug === slug || c.id === slug);
        return {
          slug,
          name: catMeta?.name || slug.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          amount: amt,
          percentage: totalMonthExpense > 0 ? Math.round((amt / totalMonthExpense) * 100) : 0,
          color: catMeta?.color || "#F43F5E",
          icon: catMeta?.icon,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [transactions, categories]);

  const vaultMap = useMemo(() => {
    const map = new Map<string, BankVault>();
    for (const v of vaults) {
      map.set(v.id, v);
    }
    return map;
  }, [vaults]);

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-0.5">
        <div>
          {!mounted || isAuthLoading || !user ? (
            <Skeleton className="h-7 sm:h-8 w-44 rounded-lg mb-1" />
          ) : (
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Hello, {user.name?.split(" ")[0] || "User"}! 👋
            </h1>
          )}
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            Here is your financial status and cashflow activity summary.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="h-8 sm:h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer border-border/80 px-2.5 sm:px-3"
            title="Refresh dashboard"
          >
            <RefreshCwIcon className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVaultDialogOpen(true)}
            className="h-8 sm:h-9 gap-1.5 text-xs font-medium border-border/80 hover:bg-muted/60 cursor-pointer px-2.5 sm:px-3"
          >
            <Building2Icon className="size-3.5 text-muted-foreground" />
            <span>Add Vault</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsTxDialogOpen(true)}
            className="h-8 sm:h-9 gap-1.5 text-xs font-semibold shadow-xs cursor-pointer px-2.5 sm:px-3"
          >
            <PlusIcon className="size-3.5" />
            <span>New Transaction</span>
          </Button>
        </div>
      </div>

      {/* 2. Top 4 Sleek Financial KPI Cards (Compact & Low-Profile) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
        {/* Card 1: Total Net Worth */}
        <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-2.5 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Total Net Worth
            </span>
            <div className="flex size-5.5 sm:size-6.5 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <WalletIcon className="size-3 sm:size-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            {isLoading ? (
              <Skeleton className="h-5 sm:h-6 w-20 sm:w-28" />
            ) : (
              <div className="font-mono text-sm sm:text-base md:text-lg font-bold text-foreground tracking-tight">
                {formatCurrency(totalNetWorth)}
              </div>
            )}
            <p className="mt-0.5 text-[9px] sm:text-[10px] text-muted-foreground truncate">
              Across {vaults.length} {vaults.length === 1 ? "vault" : "vaults"}
            </p>
          </div>
        </div>

        {/* Card 2: This Month Inflow */}
        <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-2.5 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Monthly Inflow
            </span>
            <div className="flex size-5.5 sm:size-6.5 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRightIcon className="size-3 sm:size-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            {isLoading ? (
              <Skeleton className="h-5 sm:h-6 w-20 sm:w-28" />
            ) : (
              <div className="font-mono text-sm sm:text-base md:text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                +{formatCurrency(currentMonthStats.inflow)}
              </div>
            )}
            <p className="mt-0.5 text-[9px] sm:text-[10px] text-muted-foreground truncate">
              In {MONTH_NAMES_SHORT[new Date().getMonth()]} {new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* Card 3: This Month Outflow */}
        <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-2.5 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Monthly Outflow
            </span>
            <div className="flex size-5.5 sm:size-6.5 shrink-0 items-center justify-center rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ArrowDownRightIcon className="size-3 sm:size-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            {isLoading ? (
              <Skeleton className="h-5 sm:h-6 w-20 sm:w-28" />
            ) : (
              <div className="font-mono text-sm sm:text-base md:text-lg font-bold text-rose-600 dark:text-rose-400 tracking-tight">
                -{formatCurrency(currentMonthStats.outflow)}
              </div>
            )}
            <p className="mt-0.5 text-[9px] sm:text-[10px] text-muted-foreground truncate">
              In {MONTH_NAMES_SHORT[new Date().getMonth()]} {new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* Card 4: Net Flow & Savings Rate */}
        <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-2.5 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Monthly Net Flow
            </span>
            <div className="flex size-5.5 sm:size-6.5 shrink-0 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ActivityIcon className="size-3 sm:size-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            {isLoading ? (
              <Skeleton className="h-5 sm:h-6 w-20 sm:w-28" />
            ) : (
              <div
                className={`font-mono text-sm sm:text-base md:text-lg font-bold tracking-tight ${
                  currentMonthStats.net > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : currentMonthStats.net < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-foreground"
                }`}
              >
                {currentMonthStats.net > 0 ? "+" : currentMonthStats.net < 0 ? "-" : ""}
                {formatCurrency(Math.abs(currentMonthStats.net))}
              </div>
            )}
            <p className="mt-0.5 text-[9px] sm:text-[10px] text-muted-foreground truncate">
              {currentMonthStats.inflow > 0
                ? `${currentMonthStats.savingsRate}% savings rate`
                : "No earnings yet"}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Chart: Net Worth Evolution Stacked Bar Chart */}
      <Card className="w-full shadow-xs border-border/80">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <LayersIcon className="size-4 text-primary" />
                Net Worth Evolution
              </CardTitle>
              <CardDescription>
                {period === "daily" && `Daily balance trajectory across all vaults in ${dateNavigatorLabel}`}
                {period === "monthly" && `Monthly net worth evolution for Year ${anchorDate.getFullYear()}`}
              </CardDescription>
            </div>

            {/* Granularity & Date Navigator */}
            <div className="flex flex-wrap items-center gap-2">
              <ToggleGroup
                value={[period]}
                onValueChange={(val) => {
                  if (val && val.length > 0) {
                    setPeriod(val[val.length - 1] as Granularity);
                  }
                }}
                className="rounded-lg border border-border/80 bg-muted/40 p-0.5 gap-0.5"
              >
                <ToggleGroupItem
                  value="daily"
                  className="rounded-md px-2.5 py-1 text-xs font-medium transition-all text-muted-foreground hover:text-foreground data-[pressed]:bg-background data-[pressed]:text-foreground data-[pressed]:font-semibold data-[pressed]:shadow-xs cursor-pointer"
                >
                  Daily
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="monthly"
                  className="rounded-md px-2.5 py-1 text-xs font-medium transition-all text-muted-foreground hover:text-foreground data-[pressed]:bg-background data-[pressed]:text-foreground data-[pressed]:font-semibold data-[pressed]:shadow-xs cursor-pointer"
                >
                  Monthly
                </ToggleGroupItem>
              </ToggleGroup>

              {/* Date Navigator Button: < [Label] > */}
              <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 h-7.5 text-xs overflow-hidden shadow-xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handlePrevDate}
                  className="h-full rounded-none px-2 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors border-r border-border/60 cursor-pointer"
                  title="Previous period"
                  aria-label="Previous period"
                >
                  <ChevronLeftIcon className="size-3.5" />
                </Button>
                <div className="px-3 font-semibold text-foreground select-none whitespace-nowrap min-w-[95px] text-center text-xs">
                  {dateNavigatorLabel}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleNextDate}
                  className="h-full rounded-none px-2 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors border-l border-border/60 cursor-pointer"
                  title="Next period"
                  aria-label="Next period"
                >
                  <ChevronRightIcon className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-2 sm:px-6 pt-1">
          {isLoading ? (
            <Skeleton className="h-[300px] w-full rounded-lg" />
          ) : vaults.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/30 p-8 text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2.5 shadow-xs">
                <WalletIcon className="size-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                No Vaults Available
              </h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Add your bank accounts, digital e-wallets, or cash pockets to generate your Net Worth Evolution timeline.
              </p>
              <Button
                size="sm"
                onClick={() => setIsVaultDialogOpen(true)}
                className="mt-3.5 gap-1.5 text-xs cursor-pointer"
              >
                <PlusIcon className="size-3.5" />
                Add New Vault
              </Button>
            </div>
          ) : (
            <ChartBarStacked
              showCard={false}
              data={chartData}
              config={chartConfig}
              bars={vaultBars}
              xAxisKey="shortDate"
              stackId="networth"
              showGrid={true}
              gridDashArray="3 3"
              gridOpacity={0.25}
              showYAxis={true}
              yAxisWidth={44}
              minWidth={period === "daily" ? "min-w-[880px] md:min-w-0" : "min-w-[600px] md:min-w-0"}
              hideTooltipLabel={true}
              formatYAxis={(val) =>
                val >= 1000000
                  ? `${(val / 1000000).toFixed(1)}M`
                  : val >= 1000
                  ? `${(val / 1000).toFixed(0)}k`
                  : `${val}`
              }
              chartClassName="h-[280px] w-full aspect-auto"
              margin={{ top: 16, left: 10, right: 16, bottom: 8 }}
              tooltipCursor={false}
              customTooltipContent={
                <NetWorthCustomTooltip
                  vaults={vaults}
                  formatCurrency={formatCurrency}
                />
              }
            />
          )}
        </CardContent>
      </Card>

      {/* 4. BALANCED 3-COLUMN BENTO GRID: Accounts | Recent Activity | Spending Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* BENTO CARD 1: Your Accounts / Vaults */}
        <Card className="shadow-xs border-border/80 flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <WalletIcon className="size-4 text-primary" />
                    Your Accounts
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {vaults.length} active account{vaults.length === 1 ? "" : "s"}
                  </CardDescription>
                </div>
                <Link
                  href="/dashboard/vaults"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Manage</span>
                  <ArrowRightIcon className="size-3" />
                </Link>
              </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-2.5">
              {isLoading ? (
                <div className="space-y-2 py-1">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ) : vaults.length === 0 ? (
                <div className="flex min-h-[180px] flex-col items-center justify-center p-4 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-xl">
                  <WalletIcon className="size-7 opacity-30 mb-2" />
                  <span>No vaults created yet.</span>
                  <Button
                    size="xs"
                    onClick={() => setIsVaultDialogOpen(true)}
                    className="mt-2.5 gap-1 text-xs cursor-pointer"
                  >
                    <PlusIcon className="size-3" />
                    Create Vault
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {vaults.slice(0, 3).map((v) => (
                    <Link
                      key={v.id}
                      href={`/dashboard/vaults/${v.id}`}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card/60 hover:bg-muted/40 transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="flex size-8 items-center justify-center rounded-lg text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: v.color || "#3B82F6" }}
                        >
                          {getProviderIcon(v.providerType)}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-foreground truncate max-w-[100px]">
                              {v.name}
                            </span>
                            {v.isDefault && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary uppercase">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {v.providerName || v.providerType}
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-xs text-foreground shrink-0">
                        {formatCurrency(v.balance)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </div>

          {/* Bottom Card Action */}
          {vaults.length > 0 && (
            <div className="p-4 pt-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsVaultDialogOpen(true)}
                className="w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground border-dashed border-border/80 hover:bg-muted/40 cursor-pointer h-8"
              >
                <PlusIcon className="size-3.5" />
                <span>Add Another Vault</span>
              </Button>
            </div>
          )}
        </Card>

        {/* BENTO CARD 2: Recent Activity Feed */}
        <Card className="shadow-xs border-border/80 flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ReceiptTextIcon className="size-4 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Latest recorded transactions
                  </CardDescription>
                </div>
                <Link
                  href="/dashboard/transactions"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowRightIcon className="size-3" />
                </Link>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {isLoading ? (
                <div className="space-y-2.5 py-1">
                  <Skeleton className="h-11 w-full rounded-lg" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="flex min-h-[180px] flex-col items-center justify-center p-4 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-xl">
                  <ReceiptTextIcon className="size-7 opacity-30 mb-2" />
                  <span>No movements recorded yet.</span>
                  <Button
                    size="xs"
                    onClick={() => setIsTxDialogOpen(true)}
                    className="mt-2.5 gap-1 text-xs cursor-pointer"
                  >
                    <PlusIcon className="size-3" />
                    Add Movement
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {recentTransactions.map((tx) => {
                    const isIncome = tx.amount > 0 || tx.type === "INCOME";
                    const linkedVault = vaultMap.get(tx.accountId) || tx.account;
                    const cat = categories.find(
                      (c) => c.slug === tx.category || c.id === tx.category
                    );
                    const CatIcon = getCategoryIcon(cat?.icon);

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between gap-2.5 py-2.5 hover:bg-muted/20 px-1 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Category Icon Badge */}
                          <div
                            className="flex size-7.5 items-center justify-center rounded-lg text-white shrink-0 shadow-2xs"
                            style={{
                              backgroundColor: cat?.color || (isIncome ? "#10B981" : "#F43F5E"),
                            }}
                          >
                            <CatIcon className="size-3.5" />
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <p className="text-xs font-semibold text-foreground truncate max-w-[110px]">
                              {tx.description || cat?.name || "Transaction"}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              {linkedVault && (
                                <span className="truncate max-w-[60px] text-foreground/80 font-medium">
                                  {linkedVault.name}
                                </span>
                              )}
                              <span>•</span>
                              <span>{formatDate(tx.date)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0 font-mono text-xs font-bold">
                          <span
                            className={
                              isIncome
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }
                          >
                            {isIncome ? "+" : "-"}
                            {formatCurrency(Math.abs(tx.amount))}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </div>

          {/* Bottom Card Action */}
          {recentTransactions.length > 0 && (
            <div className="p-4 pt-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsTxDialogOpen(true)}
                className="w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground border-dashed border-border/80 hover:bg-muted/40 cursor-pointer h-8"
              >
                <PlusIcon className="size-3.5" />
                <span>Record New Transaction</span>
              </Button>
            </div>
          )}
        </Card>

        {/* BENTO CARD 3: Spending Breakdown (This Month) */}
        <Card className="shadow-xs border-border/80 flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <PieChartIcon className="size-4 text-primary" />
                    Top Spending
                  </CardTitle>
                  <CardDescription className="text-xs">
                    In {MONTH_NAMES[new Date().getMonth()]} {new Date().getFullYear()}
                  </CardDescription>
                </div>
                <Link
                  href="/dashboard/cashflow"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Cashflow</span>
                  <ArrowRightIcon className="size-3" />
                </Link>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {isLoading ? (
                <div className="space-y-3 py-1">
                  <Skeleton className="h-7 w-full rounded-lg" />
                  <Skeleton className="h-7 w-full rounded-lg" />
                  <Skeleton className="h-7 w-full rounded-lg" />
                </div>
              ) : currentMonthTopCategories.length === 0 ? (
                <div className="flex min-h-[180px] flex-col items-center justify-center p-4 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-xl">
                  <PieChartIcon className="size-7 opacity-30 mb-2" />
                  <span>No spending recorded this month.</span>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {currentMonthTopCategories.map((c) => {
                    const CatIcon = getCategoryIcon(c.icon);
                    return (
                      <div key={c.slug} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="flex size-3.5 items-center justify-center rounded-full text-white shrink-0"
                              style={{ backgroundColor: c.color }}
                            >
                              <CatIcon className="size-2" />
                            </span>
                            <span className="font-medium text-foreground truncate max-w-[125px]">
                              {c.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className="font-bold text-foreground">
                              {formatCurrency(c.amount)}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-medium w-7 text-right">
                              {c.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${c.percentage}%`,
                              backgroundColor: c.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </div>

          {/* Bottom Card Footer with Total Spent */}
          {currentMonthStats.totalSpent > 0 && (
            <div className="p-4 pt-2 border-t border-border/40 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Total Spent:</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(currentMonthStats.totalSpent)}
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Modal Dialogs */}
      <TransactionDialog
        open={isTxDialogOpen}
        onOpenChange={setIsTxDialogOpen}
        vaults={vaults}
        onSuccess={() => fetchDashboardData()}
      />

      <VaultDialog
        open={isVaultDialogOpen}
        onOpenChange={setIsVaultDialogOpen}
        existingVaultCount={vaults.length}
        onSuccess={() => fetchDashboardData()}
      />
    </div>
  );
}

interface NetWorthCustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload?: Record<string, any>;
  }>;
  vaults?: BankVault[];
  formatCurrency?: (amount: number) => string;
}

function NetWorthCustomTooltip({
  active,
  payload,
  vaults = [],
  formatCurrency = (amt) => String(amt),
}: NetWorthCustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;
  const totalBal = pt.totalBalance ?? 0;
  const fullDate = pt.fullDate || pt.shortDate || "";

  return (
    <div className="rounded-lg border border-border/60 bg-background/95 p-2.5 text-xs shadow-xl backdrop-blur-xs min-w-[185px] space-y-1.5 animate-in fade-in-0 zoom-in-95">
      {fullDate && (
        <div className="text-[11px] font-medium text-muted-foreground border-b border-border/40 pb-1">
          {fullDate}
        </div>
      )}
      <div className="text-xs font-semibold text-foreground flex items-center justify-between gap-4 border-b border-border/40 pb-1">
        <span>Total</span>
        <span className="font-mono font-bold text-foreground">
          {formatCurrency(totalBal)}
        </span>
      </div>

      {/* Breakdown per vault */}
      <div className="space-y-1 pt-0.5 max-h-40 overflow-y-auto">
        {vaults.map((v) => {
          const vVal = pt[v.id] ?? 0;
          const vColor = v.color || PALETTE_FALLBACKS[0];
          return (
            <div key={v.id} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: vColor }}
                />
                <span className="truncate text-muted-foreground text-[11px]">
                  {v.name}
                </span>
              </div>
              <span className="font-mono font-medium text-foreground text-[11px] shrink-0">
                {formatCurrency(vVal)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
