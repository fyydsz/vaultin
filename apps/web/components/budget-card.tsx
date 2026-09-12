"use client";

import React, { useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  MoreVertical,
  Pencil,
  Trash2,
  ReceiptText,
  Sparkles,
  RotateCcw,
  Clock,
  TrendingUp,
  Plus,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ChartConfig } from "@/components/ui/chart";
import { ChartLineDefault } from "@/components/ui/chart-line-default";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Budget, BankVault, MonthlyBudgetStat } from "@/lib/api";
import { getCategoryIcon } from "@/components/category-select";

interface TooltipPayloadData {
  fullMonth?: string;
  month?: string;
  year?: number;
  spent?: number;
  limit?: number;
}

interface BudgetCardProps {
  budget: Budget;
  vaults?: BankVault[];
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
  onAddTransaction?: (budget: Budget) => void;
}

const chartConfig = {
  spent: {
    label: "Spent",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function BudgetCard({
  budget,
  vaults = [],
  onEdit,
  onDelete,
  onAddTransaction,
}: BudgetCardProps) {
  const formatCurrency = useCallback((val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  }, []);

  const spentFormatted = useMemo(() => formatCurrency(budget.spent || 0), [budget.spent, formatCurrency]);
  const limitFormatted = useMemo(
    () => formatCurrency(budget.effectiveAmount || budget.amount || 0),
    [budget.effectiveAmount, budget.amount, formatCurrency]
  );
  const remainingFormatted = useMemo(
    () => formatCurrency(Math.abs(budget.remaining || 0)),
    [budget.remaining, formatCurrency]
  );
  const safeDailySpendFormatted = useMemo(
    () => formatCurrency(budget.safeDailySpend || 0),
    [budget.safeDailySpend, formatCurrency]
  );

  const budgetAccentColor = budget.color || "#10B981";
  const CategoryIcon = getCategoryIcon(budget.icon || undefined);

  // Status badge config
  const statusConfig = useMemo(() => {
    if (budget.status === "OVERBUDGET" || budget.percentage >= 100) {
      return {
        label: "Over Budget",
        className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        progressColor: "bg-rose-500",
      };
    }
    if (budget.status === "WARNING" || budget.percentage >= 75) {
      return {
        label: "Near Limit",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        progressColor: "bg-amber-500",
      };
    }
    return {
      label: "On Track",
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      progressColor: "bg-emerald-500",
    };
  }, [budget.status, budget.percentage]);

  // Chart data from monthlyStats
  const { chartData } = useMemo(() => {
    let data = [];
    if (budget.monthlyStats && budget.monthlyStats.length > 0) {
      data = budget.monthlyStats.map((stat: MonthlyBudgetStat) => ({
        month: stat.shortMonth || stat.month.slice(0, 3),
        fullMonth: stat.month,
        year: stat.year,
        spent: stat.spent,
        limit: stat.limit,
      }));
    } else {
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = d.toLocaleString("en-US", { month: "short" });
        data.push({
          month: monthName,
          fullMonth: d.toLocaleString("en-US", { month: "long" }),
          year: d.getFullYear(),
          spent: i === 0 ? budget.spent : 0,
          limit: budget.amount,
        });
      }
    }

    return {
      chartData: data,
    };
  }, [budget.monthlyStats, budget.spent, budget.amount]);

  const clampedPercentage = Math.min(Math.max(budget.percentage || 0, 0), 100);

  return (
    <Card className="w-full h-full flex flex-col justify-between transition-all duration-200 hover:shadow-md border-border/80 relative group overflow-hidden bg-card/90">
      {/* Top Accent Color Bar */}
      <div
        className="h-1 w-full absolute top-0 left-0 right-0"
        style={{ backgroundColor: budgetAccentColor }}
      />

      <CardHeader className="pb-2 pt-4 px-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          {/* Category Icon and Budget Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white shadow-2xs"
              style={{ backgroundColor: budgetAccentColor }}
            >
              <CategoryIcon className="size-4" />
            </span>
            <div className="min-w-0">
              <CardTitle className="text-base font-bold text-foreground truncate">
                {budget.name}
              </CardTitle>
              <CardDescription className="text-[11px] flex items-center gap-1.5 font-medium mt-0.5">
                <span className="capitalize">{budget.categorySlug.replace(/_/g, " ")}</span>
                <span>•</span>
                <span className="capitalize">{budget.period ? budget.period.toLowerCase() : "monthly"}</span>
                {budget.period !== "CUSTOM" && (
                  <>
                    <span>•</span>
                    {budget.rolloverType === "CARRY_OVER" ? (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Sparkles className="size-2.5" />
                        Carry Over
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <RotateCcw className="size-2.5" />
                        Reset
                      </span>
                    )}
                  </>
                )}
              </CardDescription>

              {/* Linked Label Chips if any */}
              {budget.labels && budget.labels.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  {budget.labels.map((lbl) => (
                    <span
                      key={lbl}
                      className="inline-flex items-center rounded bg-secondary/80 text-secondary-foreground border border-border/60 px-1.5 py-0.2 text-[10px] font-medium font-mono"
                    >
                      #{lbl}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status Badge & Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusConfig.className}`}
            >
              {statusConfig.label}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                  />
                }
              >
                <MoreVertical className="size-3.5" />
                <span className="sr-only">Actions</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => onAddTransaction?.(budget)}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  New Transaction
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onEdit(budget)}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <Pencil className="size-3.5" />
                  Edit Budget
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={
                    <Link
                      href={`/dashboard/transactions?category=${encodeURIComponent(budget.categorySlug)}`}
                      className="gap-2 text-xs cursor-pointer flex items-center"
                    />
                  }
                >
                  <ReceiptText className="size-3.5" />
                  View Transactions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(budget)}
                  className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  Delete Budget
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Spent vs Limit & Progress */}
        <div className="space-y-2 border-t border-border/50 pt-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate block">
                Spent
              </span>
              <div
                className="text-sm sm:text-base font-bold text-foreground font-mono truncate"
                title={spentFormatted}
              >
                {spentFormatted}
              </div>
            </div>
            <div className="text-right min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate block">
                Budget Limit
              </span>
              <div
                className="text-xs font-semibold text-muted-foreground font-mono truncate"
                title={limitFormatted}
              >
                / {limitFormatted}
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-secondary/80 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-500 ${statusConfig.progressColor}`}
                style={{ width: `${clampedPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-semibold font-mono text-foreground">
                {budget.percentage}% spent
              </span>
              {budget.remaining >= 0 ? (
                <span>Remaining {remainingFormatted}</span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 font-medium">
                  Over by {remainingFormatted}
                </span>
              )}
            </div>
          </div>

          {/* Carry-over bonus notice */}
          {budget.rolloverType === "CARRY_OVER" && (budget.carryOverAmount || 0) > 0 && (
            <div className="text-[11px] bg-primary/10 text-primary border border-primary/20 rounded-md px-2 py-1 flex items-center justify-between">
              <span className="flex items-center gap-1 font-medium">
                <Sparkles className="size-3" />
                Rollover surplus:
              </span>
              <span className="font-mono font-bold">
                +{formatCurrency(budget.carryOverAmount || 0)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Middle Monthly Spending Trend Line Chart */}
      <CardContent className="py-1 px-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium px-0.5">
            <span className="font-semibold text-foreground/80">Spending Trend</span>
            <span className="font-mono text-[10px] text-muted-foreground">6 Months</span>
          </div>

          <ChartLineDefault
            showCard={false}
            scrollable={false}
            data={chartData}
            config={chartConfig}
            dataKey="spent"
            xAxisKey="month"
            lineType="monotone"
            strokeColor={budgetAccentColor}
            strokeWidth={2}
            showDots={false}
            gridOpacity={0.3}
            gridDashArray="3 3"
            chartClassName="h-[95px] w-full aspect-auto"
            margin={{ top: 6, left: 4, right: 4, bottom: 2 }}
            tooltipCursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            customTooltipFormatter={(value, name, item) => {
              const payload = (item as { payload?: TooltipPayloadData } | undefined)?.payload;
              return (
                <div className="space-y-1 min-w-[140px]">
                  <div className="text-[11px] font-semibold text-muted-foreground border-b border-border/40 pb-0.5">
                    {payload?.fullMonth || payload?.month} {payload?.year}
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">Spent:</span>
                    <span className="font-mono font-bold text-foreground">
                      {formatCurrency(Number(value))}
                    </span>
                  </div>
                </div>
              );
            }}
          />
        </div>
      </CardContent>

      {/* Footer with Safe Daily Spend & Link to Transactions */}
      <CardFooter className="flex items-center justify-between border-t border-border/50 py-2.5 px-4 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-muted-foreground text-[11px] min-w-0">
          {budget.remaining > 0 ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold font-mono truncate">
              <Clock className="size-3 shrink-0" />
              {safeDailySpendFormatted}/day ({budget.remainingDays || 1} {budget.remainingDays === 1 ? "day" : "days"} left)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold font-mono truncate">
              <TrendingUp className="size-3 shrink-0" />
              Over budget by {remainingFormatted}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {onAddTransaction && (
            <Button
              size="xs"
              variant="default"
              onClick={() => onAddTransaction(budget)}
              className="h-6.5 gap-1 text-[11px] font-medium cursor-pointer px-2"
            >
              <Plus className="size-3" />
              <span>Expense</span>
            </Button>
          )}

          {/* View Details Link */}
          <Link
            href={`/dashboard/transactions?category=${encodeURIComponent(budget.categorySlug)}`}
            className="group/link inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline hover:text-primary/80 transition-colors shrink-0 ml-1"
          >
            <span>History</span>
            <ArrowRight className="size-3 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
