"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  RefreshCwIcon,
  PencilIcon,
  Trash2Icon,
  Building2Icon,
  WalletIcon,
  BanknoteIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CheckCircle2Icon,
  ActivityIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AlertCircleIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ChartConfig } from "@/components/ui/chart";
import { ChartLineDefault } from "@/components/ui/chart-line-default";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
} from "@/components/ui/alert";
import { VaultDialog } from "@/components/vault-dialog";
import { UpdateBalanceDialog } from "@/components/update-balance-dialog";
import { DeleteVaultDialog } from "@/components/delete-vault-dialog";
import { RecentMovementsTable } from "@/components/recent-movements-table";
import { BankVault, Transaction, api } from "@/lib/api";

export type Granularity = "hourly" | "daily" | "monthly" | "yearly";

interface VaultDetailTooltipPayload {
  fullDate?: string;
  shortDate?: string;
  income: number;
  expense: number;
  net: number;
}

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

const chartConfig = {
  balance: {
    label: "Balance",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export default function VaultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vaultId = params?.id as string;

  const [vault, setVault] = useState<BankVault | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTxLoading, setIsTxLoading] = useState(true);

  // Period Toggle and Date Navigator State
  const [period, setPeriod] = useState<Granularity>("monthly");
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdateBalOpen, setIsUpdateBalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchVaultData = useCallback(async () => {
    if (!vaultId) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await api.getVaultById(vaultId);
      setVault(res.vault);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again later.";
      setFetchError(message);
      console.error("Failed to fetch vault:", err);
    } finally {
      setIsLoading(false);
    }
  }, [vaultId]);

  const fetchTransactions = useCallback(async () => {
    if (!vaultId) return;
    setIsTxLoading(true);
    try {
      const res = await api.getTransactions({ vaultId, limit: 500 });
      setTransactions(res.transactions || []);
    } catch (err) {
      console.error("Failed to fetch vault transactions:", err);
    } finally {
      setIsTxLoading(false);
    }
  }, [vaultId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchVaultData();
      void fetchTransactions();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchVaultData, fetchTransactions]);

  const formatCurrency = useCallback(
    (amount: number) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: vault?.currency || "IDR",
        maximumFractionDigits: 0,
      }).format(amount);
    },
    [vault?.currency]
  );

  // Date Navigator Previous / Next handlers
  const handlePrevDate = () => {
    setAnchorDate((prev) => {
      const next = new Date(prev);
      if (period === "hourly") {
        next.setDate(next.getDate() - 1);
      } else if (
        period === "daily" ||
        period === "monthly"
      ) {
        next.setMonth(next.getMonth() - 1);
      } else if (period === "yearly") {
        next.setFullYear(next.getFullYear() - 1);
      }
      return next;
    });
  };

  const handleNextDate = () => {
    setAnchorDate((prev) => {
      const next = new Date(prev);
      if (period === "hourly") {
        next.setDate(next.getDate() + 1);
      } else if (
        period === "daily" ||
        period === "monthly"
      ) {
        next.setMonth(next.getMonth() + 1);
      } else if (period === "yearly") {
        next.setFullYear(next.getFullYear() + 1);
      }
      return next;
    });
  };

  // Format label for the Date Navigator Button (< [Label] >)
  const dateNavigatorLabel = useMemo(() => {
    const y = anchorDate.getFullYear();
    const m = anchorDate.getMonth();

    if (period === "yearly") {
      return `${y}`;
    }
    if (period === "hourly") {
      return anchorDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    // Monthly, Daily
    return `${MONTH_NAMES[m]} ${y}`;
  }, [period, anchorDate]);

  // Generate dynamic multi-resolution time-series data for the selected period & anchor date
  const {
    chartData,
    isVsLastMonthUp,
    formattedVsLastMonth,
    periodTotalIncome,
    periodTotalExpense,
    periodNet,
    periodEndingBalance,
  } = useMemo(() => {
    const currentActiveBal = vault?.balance || 0;

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

    // Determine vault creation date and earliest activity date
    const vaultCreatedDayStart = vault?.createdAt
      ? new Date(new Date(vault.createdAt).setHours(0, 0, 0, 0)).getTime()
      : new Date(new Date().setHours(0, 0, 0, 0)).getTime();

    const earliestTxTime =
      parsedTxs.length > 0
        ? Math.min(
            ...parsedTxs.map((tx) =>
              new Date(new Date(tx.timestamp).setHours(0, 0, 0, 0)).getTime()
            )
          )
        : vaultCreatedDayStart;

    const earliestKnownTime = Math.min(vaultCreatedDayStart, earliestTxTime);

    // Helper: calculate balance at timestamp T
    // If timestamp < earliestKnownTime → return 0 (before vault creation or first transaction)
    // Otherwise → currentActiveBal - sum(tx.netDelta where tx.timestamp > timestamp)
    const getBalanceAtTime = (timestamp: number) => {
      if (timestamp < earliestKnownTime) {
        return 0;
      }

      let subsequentDelta = 0;
      for (const tx of parsedTxs) {
        if (tx.timestamp > timestamp) {
          subsequentDelta += tx.netDelta;
        }
      }
      return currentActiveBal - subsequentDelta;
    };

    const anchorYear = anchorDate.getFullYear();
    const anchorMonth = anchorDate.getMonth();
    const anchorDay = anchorDate.getDate();

    const points: Array<{
      shortDate: string;
      fullDate: string;
      balance: number;
      income: number;
      expense: number;
      net: number;
    }> = [];

    if (period === "hourly") {
      // 24 Hours of the anchor day (00:00 to 23:00)
      const dayLabel = anchorDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      for (let h = 0; h < 24; h++) {
        const hourStart = new Date(anchorYear, anchorMonth, anchorDay, h, 0, 0, 0).getTime();
        const hourEnd = new Date(anchorYear, anchorMonth, anchorDay, h, 59, 59, 999).getTime();

        let hourIncome = 0;
        let hourExpense = 0;

        for (const tx of parsedTxs) {
          if (tx.timestamp >= hourStart && tx.timestamp <= hourEnd) {
            hourIncome += tx.incomeAmt;
            hourExpense += tx.expenseAmt;
          }
        }

        const bal = getBalanceAtTime(hourEnd);
        points.push({
          shortDate: `${String(h).padStart(2, "0")}:00`,
          fullDate: `${dayLabel}, ${String(h).padStart(2, "0")}:00 - ${String(h).padStart(2, "0")}:59`,
          balance: bal,
          income: hourIncome,
          expense: hourExpense,
          net: hourIncome - hourExpense,
        });
      }
    } else if (period === "daily") {
      // Days in the anchor month (1 to 28/30/31)
      const daysInMonth = new Date(anchorYear, anchorMonth + 1, 0).getDate();

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

        const bal = getBalanceAtTime(dayEnd);
        points.push({
          shortDate: `${d} ${MONTH_NAMES_SHORT[anchorMonth]}`,
          fullDate: `${d} ${MONTH_NAMES[anchorMonth]} ${anchorYear}`,
          balance: bal,
          income: dayIncome,
          expense: dayExpense,
          net: dayIncome - dayExpense,
        });
      }
    } else if (period === "monthly") {
      // 12 Months of the anchor year (Jan to Dec)
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

        const bal = getBalanceAtTime(monthEnd);
        points.push({
          shortDate: MONTH_NAMES_SHORT[m],
          fullDate: `${MONTH_NAMES[m]} ${anchorYear}`,
          balance: bal,
          income: mIncome,
          expense: mExpense,
          net: mIncome - mExpense,
        });
      }
    } else if (period === "yearly") {
      // 5-Year span ending at the anchor year (e.g. 2022 to 2026)
      const years = [
        anchorYear - 4,
        anchorYear - 3,
        anchorYear - 2,
        anchorYear - 1,
        anchorYear,
      ];

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

        const bal = getBalanceAtTime(yEnd);
        points.push({
          shortDate: `${y}`,
          fullDate: `Year ${y}`,
          balance: bal,
          income: yIncome,
          expense: yExpense,
          net: yIncome - yExpense,
        });
      }
    }

    // Totals across the active view period
    let totalInc = 0;
    let totalExp = 0;
    for (const p of points) {
      totalInc += p.income;
      totalExp += p.expense;
    }
    const netMov = totalInc - totalExp;
    const endBal = points.length > 0 ? points[points.length - 1].balance : currentActiveBal;

    // Diff vs last calendar month for hero card
    let diff = 0;
    if (vault?.monthlyStats && vault.monthlyStats.length >= 2) {
      const stats = vault.monthlyStats;
      const curMonthBal = stats[stats.length - 1]?.balance ?? currentActiveBal;
      const lastMonthBal = stats[stats.length - 2]?.balance ?? 0;
      diff = curMonthBal - lastMonthBal;
    } else {
      diff = currentActiveBal;
    }
    const isUp = diff >= 0;
    const formatted = `${diff >= 0 ? "+" : "-"}${formatCurrency(Math.abs(diff))}`;

    return {
      chartData: points,
      diffVsLastMonth: diff,
      isVsLastMonthUp: isUp,
      formattedVsLastMonth: formatted,
      periodTotalIncome: totalInc,
      periodTotalExpense: totalExp,
      periodNet: netMov,
      periodEndingBalance: endBal,
    };
  }, [vault, transactions, period, anchorDate, formatCurrency]);

  const getProviderIcon = (type?: string) => {
    switch (type) {
      case "BANK":
        return <Building2Icon className="size-5" />;
      case "E_WALLET":
        return <WalletIcon className="size-5" />;
      case "CASH":
        return <BanknoteIcon className="size-5" />;
      default:
        return <WalletIcon className="size-5" />;
    }
  };

  const handleSetDefault = async () => {
    if (!vault || vault.isDefault) return;

    try {
      await api.updateVault(vault.id, { isDefault: true });
      await fetchVaultData();
    } catch (err) {
      console.error("Failed to set vault as default:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="flex min-h-[400px] flex-1 flex-col items-center justify-center p-6 max-w-lg mx-auto">
        <Alert variant="destructive" className="mb-4">
          <AlertCircleIcon className="size-4 shrink-0" />
          <AlertTitle className="font-semibold">Something went wrong</AlertTitle>
          <AlertDescription className="text-xs text-destructive/90">
            {fetchError || "The requested vault could not be loaded."}
          </AlertDescription>
          <AlertAction className="flex gap-2">
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                fetchVaultData();
                fetchTransactions();
              }}
              className="h-7 px-2 text-xs border-destructive/30 hover:bg-destructive/10"
            >
              <RefreshCwIcon className="size-3 mr-1" />
              Retry
            </Button>
          </AlertAction>
        </Alert>
        <Button variant="outline" onClick={() => router.push("/dashboard/vaults")}>
          Back to Vaults
        </Button>
      </div>
    );
  }

  const vaultAccentColor = vault.color || "#3B82F6";

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Top Breadcrumb / Back Navigation */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/vaults"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to All Vaults
        </Link>
      </div>

      {/* Vault Header Hero Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-sm">
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: vaultAccentColor }}
        />

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
              style={{ backgroundColor: vaultAccentColor }}
            >
              {getProviderIcon(vault.providerType)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {vault.name}
                </h1>
                {vault.isDefault && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    <CheckCircle2Icon className="size-3.5" />
                    Primary Vault
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                <span>{vault.providerName}</span>
                <span className="mx-1.5">•</span>
                <span className="capitalize">
                  {vault.accountType.toLowerCase().replace("_", " ")}
                </span>
                <span className="mx-1.5">•</span>
                <span>Currency: {vault.currency || "IDR"}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setIsUpdateBalOpen(true)}
              className="gap-2 text-xs font-semibold"
            >
              <RefreshCwIcon className="size-3.5" />
              Update Balance
            </Button>
            {!vault.isDefault && (
              <Button
                variant="outline"
                onClick={handleSetDefault}
                className="gap-1.5 text-xs"
              >
                <CheckCircle2Icon className="size-3.5" />
                Set as Default
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(true)}
              className="gap-1.5 text-xs"
            >
              <PencilIcon className="size-3.5" />
              Edit Vault
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Trash2Icon className="size-3.5" />
              Delete
            </Button>
          </div>
        </div>

        {/* Current Balance Row */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-t border-border/60 pt-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current Balance
            </span>
            <div className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
              {formatCurrency(vault.balance)}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            {isVsLastMonthUp ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                <TrendingUpIcon className="size-4" />
                {formattedVsLastMonth}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold font-mono">
                <TrendingDownIcon className="size-4" />
                {formattedVsLastMonth}
              </span>
            )}
            <span>vs last month</span>
          </div>
        </div>
      </div>

      {/* FULL-WIDTH: Balance Trajectory Chart with ToggleGroup & Date Navigator */}
      <Card className="w-full shadow-xs border-border/80">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ActivityIcon className="size-4 text-primary" />
                Balance Trajectory
              </CardTitle>
              <CardDescription>
                {period === "hourly" && `Hourly balance progression for ${dateNavigatorLabel}`}
                {period === "daily" && `Daily progression across ${dateNavigatorLabel}`}
                {period === "monthly" && `Monthly progression across Year ${anchorDate.getFullYear()}`}
                {period === "yearly" && `Multi-year trajectory ending in ${anchorDate.getFullYear()}`}
              </CardDescription>
            </div>

            {/* Granularity Toggle Group + Date Navigator (< [Label] >) */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Toggle Group */}
              <ToggleGroup
                value={[period]}
                onValueChange={(val) => {
                  if (val && val.length > 0) {
                    setPeriod(val[val.length - 1] as Granularity);
                  }
                }}
                className="rounded-lg border border-border/80 bg-muted/40 p-1 gap-0.5"
              >
                <ToggleGroupItem
                  value="hourly"
                  className="rounded-md px-3 py-1 text-xs font-medium transition-all text-muted-foreground hover:text-foreground data-[pressed]:bg-white data-[pressed]:text-black dark:data-[pressed]:bg-white dark:data-[pressed]:text-black light:data-[pressed]:bg-zinc-900 light:data-[pressed]:text-white data-[pressed]:font-semibold data-[pressed]:shadow-xs cursor-pointer"
                >
                  Hourly
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="daily"
                  className="rounded-md px-3 py-1 text-xs font-medium transition-all text-muted-foreground hover:text-foreground data-[pressed]:bg-white data-[pressed]:text-black dark:data-[pressed]:bg-white dark:data-[pressed]:text-black light:data-[pressed]:bg-zinc-900 light:data-[pressed]:text-white data-[pressed]:font-semibold data-[pressed]:shadow-xs cursor-pointer"
                >
                  Daily
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="monthly"
                  className="rounded-md px-3 py-1 text-xs font-medium transition-all text-muted-foreground hover:text-foreground data-[pressed]:bg-white data-[pressed]:text-black dark:data-[pressed]:bg-white dark:data-[pressed]:text-black light:data-[pressed]:bg-zinc-900 light:data-[pressed]:text-white data-[pressed]:font-semibold data-[pressed]:shadow-xs cursor-pointer"
                >
                  Monthly
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="yearly"
                  className="rounded-md px-3 py-1 text-xs font-medium transition-all text-muted-foreground hover:text-foreground data-[pressed]:bg-white data-[pressed]:text-black dark:data-[pressed]:bg-white dark:data-[pressed]:text-black light:data-[pressed]:bg-zinc-900 light:data-[pressed]:text-white data-[pressed]:font-semibold data-[pressed]:shadow-xs cursor-pointer"
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
                <div className="px-3.5 font-semibold text-foreground select-none whitespace-nowrap min-w-[105px] text-center">
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
            </div>
          </div>

          {/* Period Summary Metric Badges */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 border-t border-border/40 pt-3 text-xs">
            <div className="rounded-lg bg-card/60 p-2.5 border border-border/40">
              <span className="text-[11px] font-medium text-muted-foreground">Inflow</span>
              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                +{formatCurrency(periodTotalIncome)}
              </div>
            </div>
            <div className="rounded-lg bg-card/60 p-2.5 border border-border/40">
              <span className="text-[11px] font-medium text-muted-foreground">Outflow</span>
              <div className="font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                -{formatCurrency(periodTotalExpense)}
              </div>
            </div>
            <div className="rounded-lg bg-card/60 p-2.5 border border-border/40">
              <span className="text-[11px] font-medium text-muted-foreground">Net Flow</span>
              <div
                className={`font-mono font-bold mt-0.5 ${
                  periodNet >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {periodNet >= 0 ? "+" : "-"}
                {formatCurrency(Math.abs(periodNet))}
              </div>
            </div>
            <div className="rounded-lg bg-card/60 p-2.5 border border-border/40">
              <span className="text-[11px] font-medium text-muted-foreground">Period Ending Bal</span>
              <div className="font-mono font-bold text-foreground mt-0.5">
                {formatCurrency(periodEndingBalance)}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <ChartLineDefault
            showCard={false}
            data={chartData}
            config={chartConfig}
            dataKey="balance"
            xAxisKey="shortDate"
            lineType="monotone"
            strokeColor={vaultAccentColor}
            strokeWidth={2}
            showDots={false}
            showGrid={true}
            gridDashArray="3 3"
            gridOpacity={0.25}
            showYAxis={true}
            formatYAxis={(val) =>
              val >= 1000000
                ? `${(val / 1000000).toFixed(1)}M`
                : val >= 1000
                ? `${(val / 1000).toFixed(0)}k`
                : `${val}`
            }
            minWidth={
              period === "daily"
                ? "min-w-[880px] md:min-w-0"
                : period === "monthly"
                ? "min-w-[600px] md:min-w-0"
                : undefined
            }
            chartClassName="h-[320px] w-full aspect-auto"
            margin={{ top: 16, left: 12, right: 24, bottom: 12 }}
            tooltipCursor={false}
            customTooltipFormatter={(value, name, item) => {
              const payload = (item as { payload?: VaultDetailTooltipPayload } | undefined)?.payload;
              return (
                <div className="space-y-1.5 p-0.5 min-w-[170px]">
                  <div className="text-[11px] font-semibold text-muted-foreground border-b border-border/40 pb-1">
                    {payload?.fullDate || payload?.shortDate}
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">Balance:</span>
                    <span className="font-mono font-bold text-foreground">
                      {formatCurrency(Number(value))}
                    </span>
                  </div>
                  {payload && (payload.income > 0 || payload.expense > 0 || payload.net !== 0) && (
                    <div className="space-y-1 pt-1 border-t border-border/40 text-[10px]">
                      {payload.income > 0 && (
                        <div className="flex items-center justify-between gap-2 text-emerald-600 dark:text-emerald-400">
                          <span className="text-muted-foreground">Inflow:</span>
                          <span className="font-mono font-semibold">+{formatCurrency(payload.income)}</span>
                        </div>
                      )}
                      {payload.expense > 0 && (
                        <div className="flex items-center justify-between gap-2 text-rose-600 dark:text-rose-400">
                          <span className="text-muted-foreground">Outflow:</span>
                          <span className="font-mono font-semibold">-{formatCurrency(payload.expense)}</span>
                        </div>
                      )}
                      {payload.net !== 0 && (
                        <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-border/20 font-bold">
                          <span className="text-muted-foreground">Net Movement:</span>
                          <span
                            className={`font-mono ${
                              payload.net >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {payload.net >= 0 ? "+" : "-"}
                            {formatCurrency(Math.abs(payload.net))}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }}
          />
        </CardContent>
      </Card>

      {/* FULL-WIDTH: Transactions Linked to this Account */}
      <Card className="w-full shadow-xs border-border/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">
                Recent Movements
              </CardTitle>
              <CardDescription>
                Chronological list of incomes & expenses associated with this vault
              </CardDescription>
            </div>
            <Link
              href="/dashboard/transactions"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View All
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <RecentMovementsTable
            transactions={transactions}
            isLoading={isTxLoading}
            currency={vault.currency}
            accountName={vault.name}
            onTransactionDeleted={() => {
              fetchVaultData();
              fetchTransactions();
            }}
          />
        </CardContent>
      </Card>

      {/* Edit Vault Modal Dialog */}
      <VaultDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        vaultToEdit={vault}
        onSuccess={() => {
          fetchVaultData();
        }}
      />

      {/* Update Balance Modal Dialog */}
      <UpdateBalanceDialog
        open={isUpdateBalOpen}
        onOpenChange={setIsUpdateBalOpen}
        vault={vault}
        onSuccess={() => {
          fetchVaultData();
          fetchTransactions();
        }}
      />

      {/* Delete Vault Modal Dialog */}
      <DeleteVaultDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        vault={vault}
        onSuccess={() => {
          router.push("/dashboard/vaults");
        }}
      />
    </div>
  );
}
