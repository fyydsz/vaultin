"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useMounted } from "@/hooks/use-mounted";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  ActivityIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Building2Icon,
  WalletIcon,
  PercentIcon,
  RefreshCwIcon,
  SparklesIcon,
  LayersIcon,
  PieChartIcon,
  BarChart3Icon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  CalendarIcon,
  FilterIcon,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BankVault, Transaction, api } from "@/lib/api";
import { useCategoryStore } from "@/stores/category-store";
import {
  CashflowInflowOutflowChart,
  CashflowCumulativeAreaChart,
  CashflowCategoryDonutChart,
  type CashflowPoint,
  type CategoryBreakdownItem,
  formatIDR,
} from "@/components/cashflow-charts";

export type Granularity = "daily" | "monthly" | "yearly";

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

export default function CashflowPage() {
  const { user } = useAuth();
  const mounted = useMounted();

  const [vaults, setVaults] = useState<BankVault[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Time Series Granularity & Date Navigator State
  const [period, setPeriod] = useState<Granularity>("monthly");
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());

  // Filters
  const [selectedVaultId, setSelectedVaultId] = useState<string>("ALL");
  const [categoryTypeTab, setCategoryTypeTab] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  const { categories, fetchCategories } = useCategoryStore();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vaultsRes, txRes] = await Promise.all([
        api.getVaults().catch(() => ({ vaults: [], summary: { totalBalance: 0, count: 0 } })),
        api.getTransactions({ limit: 1000 }).catch(() => ({
          transactions: [],
          pagination: { page: 1, limit: 1000, total: 0, totalPages: 1 },
        })),
      ]);
      setVaults(vaultsRes.vaults || []);
      setTransactions(txRes.transactions || []);
    } catch (err) {
      console.error("Failed to load cashflow data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    const timer = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData, fetchCategories]);

  // Date Navigator handlers
  const handlePrevDate = () => {
    setAnchorDate((prev) => {
      const next = new Date(prev);
      if (period === "daily") {
        next.setMonth(next.getMonth() - 1);
      } else if (period === "monthly") {
        next.setFullYear(next.getFullYear() - 1);
      } else if (period === "yearly") {
        next.setFullYear(next.getFullYear() - 5);
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
      } else if (period === "yearly") {
        next.setFullYear(next.getFullYear() + 5);
      }
      return next;
    });
  };

  // Date Navigator Label (< [Label] >)
  const dateNavigatorLabel = useMemo(() => {
    const y = anchorDate.getFullYear();
    const m = anchorDate.getMonth();

    if (period === "yearly") {
      return `${y - 4} - ${y}`;
    }
    if (period === "monthly") {
      return `Year ${y}`;
    }
    return `${MONTH_NAMES[m]} ${y}`;
  }, [period, anchorDate]);

  // Filter transactions by selected vault
  const scopedTransactions = useMemo(() => {
    if (selectedVaultId === "ALL") return transactions;
    return transactions.filter((tx) => tx.accountId === selectedVaultId);
  }, [transactions, selectedVaultId]);

  // Generate Time-Series Cashflow Points for Charts & Tables
  const {
    points,
    periodTotalIncome,
    periodTotalExpense,
    periodNetCashflow,
    periodSavingsRate,
    expenseBreakdown,
    incomeBreakdown,
  } = useMemo(() => {
    const parsedTxs = scopedTransactions.map((tx) => {
      const d = new Date(tx.date);
      const amt = Math.abs(tx.amount);
      const isInc = tx.type === "INCOME" || tx.amount > 0;
      return {
        ...tx,
        timestamp: d.getTime(),
        incomeAmt: isInc ? amt : 0,
        expenseAmt: isInc ? 0 : amt,
      };
    });

    const anchorYear = anchorDate.getFullYear();
    const anchorMonth = anchorDate.getMonth();

    const pts: CashflowPoint[] = [];
    let runningCumulativeNet = 0;

    let periodStartTimestamp = 0;
    let periodEndTimestamp = 0;

    if (period === "daily") {
      const daysInMonth = new Date(anchorYear, anchorMonth + 1, 0).getDate();
      periodStartTimestamp = new Date(anchorYear, anchorMonth, 1, 0, 0, 0, 0).getTime();
      periodEndTimestamp = new Date(anchorYear, anchorMonth, daysInMonth, 23, 59, 59, 999).getTime();

      for (let d = 1; d <= daysInMonth; d++) {
        const dayStart = new Date(anchorYear, anchorMonth, d, 0, 0, 0, 0).getTime();
        const dayEnd = new Date(anchorYear, anchorMonth, d, 23, 59, 59, 999).getTime();

        let dayIncome = 0;
        let dayExpense = 0;

        for (const tx of parsedTxs) {
          if (tx.timestamp >= dayStart && tx.timestamp <= dayEnd) {
            dayIncome += tx.incomeAmt;
            dayExpense += tx.expenseAmt;
          }
        }

        const net = dayIncome - dayExpense;
        runningCumulativeNet += net;
        const rate = dayIncome > 0 ? Math.round((net / dayIncome) * 100) : 0;

        pts.push({
          label: `${d} ${MONTH_NAMES_SHORT[anchorMonth]}`,
          fullDate: `${d} ${MONTH_NAMES[anchorMonth]} ${anchorYear}`,
          income: dayIncome,
          expense: dayExpense,
          net,
          cumulativeNet: runningCumulativeNet,
          savingsRate: rate,
        });
      }
    } else if (period === "monthly") {
      periodStartTimestamp = new Date(anchorYear, 0, 1, 0, 0, 0, 0).getTime();
      periodEndTimestamp = new Date(anchorYear, 11, 31, 23, 59, 59, 999).getTime();

      for (let m = 0; m < 12; m++) {
        const monthStart = new Date(anchorYear, m, 1, 0, 0, 0, 0).getTime();
        const monthEnd = new Date(anchorYear, m + 1, 0, 23, 59, 59, 999).getTime();

        let mIncome = 0;
        let mExpense = 0;

        for (const tx of parsedTxs) {
          if (tx.timestamp >= monthStart && tx.timestamp <= monthEnd) {
            mIncome += tx.incomeAmt;
            mExpense += tx.expenseAmt;
          }
        }

        const net = mIncome - mExpense;
        runningCumulativeNet += net;
        const rate = mIncome > 0 ? Math.round((net / mIncome) * 100) : 0;

        pts.push({
          label: MONTH_NAMES_SHORT[m],
          fullDate: `${MONTH_NAMES[m]} ${anchorYear}`,
          income: mIncome,
          expense: mExpense,
          net,
          cumulativeNet: runningCumulativeNet,
          savingsRate: rate,
        });
      }
    } else if (period === "yearly") {
      const years = [
        anchorYear - 4,
        anchorYear - 3,
        anchorYear - 2,
        anchorYear - 1,
        anchorYear,
      ];
      periodStartTimestamp = new Date(years[0], 0, 1, 0, 0, 0, 0).getTime();
      periodEndTimestamp = new Date(years[4], 11, 31, 23, 59, 59, 999).getTime();

      for (const y of years) {
        const yStart = new Date(y, 0, 1, 0, 0, 0, 0).getTime();
        const yEnd = new Date(y, 11, 31, 23, 59, 59, 999).getTime();

        let yIncome = 0;
        let yExpense = 0;

        for (const tx of parsedTxs) {
          if (tx.timestamp >= yStart && tx.timestamp <= yEnd) {
            yIncome += tx.incomeAmt;
            yExpense += tx.expenseAmt;
          }
        }

        const net = yIncome - yExpense;
        runningCumulativeNet += net;
        const rate = yIncome > 0 ? Math.round((net / yIncome) * 100) : 0;

        pts.push({
          label: `${y}`,
          fullDate: `Year ${y}`,
          income: yIncome,
          expense: yExpense,
          net,
          cumulativeNet: runningCumulativeNet,
          savingsRate: rate,
        });
      }
    }

    // Totals across the active view period
    let totalInc = 0;
    let totalExp = 0;
    for (const p of pts) {
      totalInc += p.income;
      totalExp += p.expense;
    }
    const netFlow = totalInc - totalExp;
    const savingsRate =
      totalInc > 0 ? Math.round((netFlow / totalInc) * 100) : 0;

    // Filter transactions strictly within the active period for Category Breakdown
    const periodTxs = parsedTxs.filter(
      (tx) =>
        tx.timestamp >= periodStartTimestamp &&
        tx.timestamp <= periodEndTimestamp
    );

    // Group expenses by category
    const expMap = new Map<string, { count: number; total: number }>();
    const incMap = new Map<string, { count: number; total: number }>();

    for (const tx of periodTxs) {
      const catKey = tx.category || "other_expense";
      const amt = Math.abs(tx.amount);
      if (tx.incomeAmt > 0) {
        const cur = incMap.get(catKey) || { count: 0, total: 0 };
        incMap.set(catKey, { count: cur.count + 1, total: cur.total + amt });
      } else {
        const cur = expMap.get(catKey) || { count: 0, total: 0 };
        expMap.set(catKey, { count: cur.count + 1, total: cur.total + amt });
      }
    }

    const expBreakdown: CategoryBreakdownItem[] = Array.from(expMap.entries())
      .map(([slug, data]) => {
        const catMeta = categories.find((c) => c.slug === slug || c.id === slug);
        const name = catMeta?.name || slug.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        const pct = totalExp > 0 ? Math.round((data.total / totalExp) * 100) : 0;
        return {
          category: slug,
          name,
          type: "EXPENSE",
          totalAmount: data.total,
          count: data.count,
          percentage: pct,
          color: catMeta?.color || "#F43F5E",
          icon: catMeta?.icon,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const incBreakdown: CategoryBreakdownItem[] = Array.from(incMap.entries())
      .map(([slug, data]) => {
        const catMeta = categories.find((c) => c.slug === slug || c.id === slug);
        const name = catMeta?.name || slug.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        const pct = totalInc > 0 ? Math.round((data.total / totalInc) * 100) : 0;
        return {
          category: slug,
          name,
          type: "INCOME",
          totalAmount: data.total,
          count: data.count,
          percentage: pct,
          color: catMeta?.color || "#10B981",
          icon: catMeta?.icon,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      points: pts,
      periodTotalIncome: totalInc,
      periodTotalExpense: totalExp,
      periodNetCashflow: netFlow,
      periodSavingsRate: savingsRate,
      expenseBreakdown: expBreakdown,
      incomeBreakdown: incBreakdown,
    };
  }, [scopedTransactions, period, anchorDate, categories]);

  return (
    <div className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      {/* Top Header & Interactive Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-0.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUpIcon className="size-5 sm:size-6 text-primary" />
            Cashflow Analytics
          </h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Monitor income vs expense dynamics, savings trajectory, and category distribution.
          </p>
        </div>

        {/* Action Controls: Granularity Switcher, Date Navigator, Vault Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Vault Selector Filter */}
          <Select
            value={selectedVaultId}
            onValueChange={(val) => val && setSelectedVaultId(val)}
          >
            <SelectTrigger className="h-8 text-xs min-w-[130px] bg-muted/40 border-border/80 cursor-pointer">
              <SelectValue placeholder="All Vaults">
                {selectedVaultId === "ALL" ? (
                  <span>All Vaults</span>
                ) : (
                  (() => {
                    const selVault = vaults.find((v) => v.id === selectedVaultId);
                    if (!selVault) return "All Vaults";
                    return (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: selVault.color || "#3B82F6" }}
                        />
                        <span className="truncate font-medium text-foreground">
                          {selVault.name}
                        </span>
                      </div>
                    );
                  })()
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-56">
              <SelectItem value="ALL" className="text-xs">
                All Vaults
              </SelectItem>
              {vaults.map((v) => (
                <SelectItem key={v.id} value={v.id} className="text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: v.color || "#3B82F6" }}
                    />
                    <span>{v.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Granularity Toggle Group (Daily, Monthly, Yearly) */}
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
            <ToggleGroupItem
              value="yearly"
              className="rounded-md px-2.5 py-1 text-xs font-medium transition-all text-muted-foreground hover:text-foreground data-[pressed]:bg-background data-[pressed]:text-foreground data-[pressed]:font-semibold data-[pressed]:shadow-xs cursor-pointer"
            >
              Yearly
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Date Navigator Button: < [Label] > */}
          <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 h-8 text-xs overflow-hidden shadow-xs">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handlePrevDate}
              className="h-full rounded-none px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors border-r border-border/60 cursor-pointer"
              title="Previous period"
              aria-label="Previous period"
            >
              <ChevronLeftIcon className="size-3.5" />
            </Button>
            <div className="px-3 font-semibold text-foreground select-none whitespace-nowrap min-w-[105px] text-center text-xs">
              {dateNavigatorLabel}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleNextDate}
              className="h-full rounded-none px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors border-l border-border/60 cursor-pointer"
              title="Next period"
              aria-label="Next period"
            >
              <ChevronRightIcon className="size-3.5" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="icon-xs"
            onClick={fetchData}
            disabled={isLoading}
            className="size-8 border-border/80 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh cashflow data"
          >
            <RefreshCwIcon className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* KPI Financial Metric Summary Cards (Compact & Low-Profile) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
        {/* Total Inflow */}
        <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-2.5 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Total Inflow
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
                +{formatIDR(periodTotalIncome)}
              </div>
            )}
            <p className="mt-0.5 text-[9px] sm:text-[10px] text-muted-foreground truncate">
              Earned in {dateNavigatorLabel}
            </p>
          </div>
        </div>

        {/* Total Outflow */}
        <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-2.5 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Total Outflow
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
                -{formatIDR(periodTotalExpense)}
              </div>
            )}
            <p className="mt-0.5 text-[9px] sm:text-[10px] text-muted-foreground truncate">
              Spent in {dateNavigatorLabel}
            </p>
          </div>
        </div>

        {/* Net Cashflow */}
        <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-2.5 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Net Cashflow
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
                  periodNetCashflow > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : periodNetCashflow < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-foreground"
                }`}
              >
                {periodNetCashflow > 0 ? "+" : periodNetCashflow < 0 ? "-" : ""}
                {formatIDR(Math.abs(periodNetCashflow))}
              </div>
            )}
            <p className="mt-0.5 text-[9px] sm:text-[10px] text-muted-foreground truncate">
              {periodNetCashflow > 0
                ? "Surplus / Savings"
                : periodNetCashflow < 0
                ? "Deficit / Negative flow"
                : "Balanced / Break-even"}
            </p>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-2.5 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Savings Rate
            </span>
            <div className="flex size-5.5 sm:size-6.5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <PercentIcon className="size-3 sm:size-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            {isLoading ? (
              <Skeleton className="h-5 sm:h-6 w-20 sm:w-24" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <div
                  className={`font-mono text-sm sm:text-base md:text-lg font-bold tracking-tight ${
                    periodSavingsRate >= 20
                      ? "text-emerald-600 dark:text-emerald-400"
                      : periodSavingsRate > 0
                      ? "text-foreground"
                      : periodSavingsRate === 0
                      ? "text-muted-foreground"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {periodSavingsRate}%
                </div>
                <span
                  className={`text-[9px] font-semibold px-1 py-0.2 rounded ${
                    periodSavingsRate >= 20
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : periodSavingsRate > 0
                      ? "bg-muted text-muted-foreground"
                      : periodSavingsRate === 0
                      ? "bg-muted text-muted-foreground"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {periodSavingsRate >= 20
                    ? "Healthy"
                    : periodSavingsRate > 0
                    ? "Moderate"
                    : periodSavingsRate === 0
                    ? "Break-even"
                    : "Deficit"}
                </span>
              </div>
            )}
            <p className="mt-0.5 text-[9px] sm:text-[10px] text-muted-foreground truncate">
              % of inflow retained
            </p>
          </div>
        </div>
      </div>

      {/* FULL-WIDTH: Inflow vs Outflow Dynamics Chart */}
      <Card className="w-full shadow-xs border-border/80">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3Icon className="size-4 text-primary" />
                Inflow vs Outflow Dynamics
              </CardTitle>
              <CardDescription>
                Side-by-side progression of income (green), expenses (red), and resulting net cashflow (purple) in {dateNavigatorLabel}.
              </CardDescription>
            </div>

            {/* Inflow / Outflow Legend Badges */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="size-2.5 rounded-sm bg-emerald-500" />
                <span className="text-muted-foreground">Inflow</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="size-2.5 rounded-sm bg-rose-500" />
                <span className="text-muted-foreground">Outflow</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="size-2 rounded-full bg-purple-500" />
                <span className="text-muted-foreground">Net Flow</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {isLoading ? (
            <Skeleton className="h-[320px] w-full rounded-lg" />
          ) : points.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center text-center text-muted-foreground">
              <p className="text-xs">No transaction records in this period.</p>
            </div>
          ) : (
            <CashflowInflowOutflowChart data={points} />
          )}
        </CardContent>
      </Card>

      {/* TWO-COLUMN GRID: Cumulative Trajectory & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumulative Savings Trajectory */}
        <Card className="shadow-xs border-border/80 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <LayersIcon className="size-4 text-primary" />
              Cumulative Savings Trajectory
            </CardTitle>
            <CardDescription>
              Continuous net savings accumulation over {dateNavigatorLabel}.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <Skeleton className="h-[220px] w-full rounded-lg" />
            ) : (
              <CashflowCumulativeAreaChart data={points} />
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown (Expense vs Income Donut & Ranked Bars) */}
        <Card className="shadow-xs border-border/80 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <PieChartIcon className="size-4 text-primary" />
                  Category Distribution
                </CardTitle>
                <CardDescription>
                  Share and breakdown of your {categoryTypeTab.toLowerCase()} items.
                </CardDescription>
              </div>

              {/* Tab Switcher: Expense vs Income */}
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/80 p-1 border border-border/50 text-xs">
                <button
                  type="button"
                  onClick={() => setCategoryTypeTab("EXPENSE")}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    categoryTypeTab === "EXPENSE"
                      ? "bg-background text-rose-600 dark:text-rose-400 shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Expenses
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryTypeTab("INCOME")}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    categoryTypeTab === "INCOME"
                      ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Incomes
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <Skeleton className="h-[220px] w-full rounded-lg" />
            ) : (
              <CashflowCategoryDonutChart
                categories={categoryTypeTab === "EXPENSE" ? expenseBreakdown : incomeBreakdown}
                type={categoryTypeTab}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* FULL-WIDTH: Periodic Cashflow Breakdown Table */}
      <Card className="w-full shadow-xs border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ActivityIcon className="size-4 text-primary" />
            Periodic Cashflow Breakdown
          </CardTitle>
          <CardDescription>
            Chronological breakdown table for {dateNavigatorLabel} with inflow, outflow, and net rates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/80 bg-card/60 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                    <th className="px-4 py-2.5 whitespace-nowrap">Period</th>
                    <th className="px-4 py-2.5 text-right whitespace-nowrap">Inflow</th>
                    <th className="px-4 py-2.5 text-right whitespace-nowrap">Outflow</th>
                    <th className="px-4 py-2.5 text-right whitespace-nowrap">Net Flow</th>
                    <th className="px-4 py-2.5 text-right whitespace-nowrap">Savings Rate</th>
                    <th className="px-4 py-2.5 text-center whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {points.length > 0 ? (
                    points.map((pt, idx) => {
                      const isNetPos = pt.net >= 0;
                      const hasActivity = pt.income > 0 || pt.expense > 0;
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-muted/30 transition-colors font-medium text-foreground"
                        >
                          <td className="px-4 py-2.5 font-sans font-medium text-foreground">
                            {pt.fullDate || pt.label}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold">
                            {pt.income > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                +{formatIDR(pt.income)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40 font-normal">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold">
                            {pt.expense > 0 ? (
                              <span className="text-rose-600 dark:text-rose-400">
                                -{formatIDR(pt.expense)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40 font-normal">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold">
                            {pt.net !== 0 ? (
                              <span
                                className={
                                  pt.net > 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }
                              >
                                {isNetPos ? "+" : "-"}
                                {formatIDR(Math.abs(pt.net))}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40 font-normal">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium">
                            {pt.income > 0 ? (
                              <span>{pt.savingsRate}%</span>
                            ) : (
                              <span className="text-muted-foreground/40 font-normal">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center font-sans">
                            {!hasActivity ? (
                              <span className="text-muted-foreground/40 font-normal">
                                —
                              </span>
                            ) : pt.net > 0 ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                Surplus
                              </span>
                            ) : pt.net < 0 ? (
                              <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                                Deficit
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                Balanced
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground font-sans">
                        No periodic data recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
