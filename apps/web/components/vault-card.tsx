"use client";

import React, { useCallback, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  MoreVertical,
  Pencil,
  Trash2,
  Building2,
  Wallet,
  Banknote,
  CheckCircle2,
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
import { BankVault, MonthlyStat } from "@/lib/api";

interface TooltipPayloadData {
  fullMonth?: string;
  month?: string;
  year?: number;
  income?: number;
  expense?: number;
  net?: number;
}

interface VaultCardProps {
  vault: BankVault;
  onUpdateBalance: (vault: BankVault) => void;
  onEdit: (vault: BankVault) => void;
  onSetDefault: (vault: BankVault) => void;
  onDelete: (vault: BankVault) => void;
}

const chartConfig = {
  balance: {
    label: "Balance",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

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

export function VaultCard({
  vault,
  onUpdateBalance,
  onEdit,
  onSetDefault,
  onDelete,
}: VaultCardProps) {
  // Format currency
  const formatCurrency = useCallback(
    (val: number) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: vault.currency || "IDR",
        maximumFractionDigits: 0,
      }).format(val);
    },
    [vault.currency]
  );

  const formattedBalance = useMemo(() => {
    return formatCurrency(vault.balance || 0);
  }, [vault.balance, formatCurrency]);

  // Use real single-line monthly balance data from database
  const { chartData, isVsLastMonthUp, formattedVsLastMonth } = useMemo(() => {
    let data = [];

    if (vault.monthlyStats && vault.monthlyStats.length > 0) {
      data = vault.monthlyStats.map((stat: MonthlyStat) => ({
        month: stat.shortMonth || stat.month.slice(0, 3),
        fullMonth: stat.month,
        year: stat.year,
        balance: stat.balance,
        income: stat.income,
        expense: stat.expense,
        net: stat.net,
      }));
    } else {
      // No monthly stats available — show currentBalance for all months
      // since we have no historical data to differentiate
      const now = new Date();
      const currentBal = vault.balance || 0;
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = MONTH_NAMES[d.getMonth()];
        data.push({
          month: monthName.slice(0, 3),
          fullMonth: monthName,
          year: d.getFullYear(),
          balance: i === 0 ? currentBal : 0,
          income: 0,
          expense: 0,
          net: 0,
        });
      }
    }

    // Calculate diff between this month (last element) and previous month (second to last)
    const currentMonthBal = data[data.length - 1]?.balance ?? 0;
    const lastMonthBal = data.length >= 2 ? (data[data.length - 2]?.balance ?? 0) : 0;
    const diff = currentMonthBal - lastMonthBal;
    const isUp = diff >= 0;
    const formatted = `${diff >= 0 ? "+" : "-"}${formatCurrency(Math.abs(diff))}`;

    return {
      chartData: data,
      isVsLastMonthUp: isUp,
      formattedVsLastMonth: formatted,
    };
  }, [vault.monthlyStats, vault.balance, formatCurrency]);

  const getProviderIcon = () => {
    switch (vault.providerType) {
      case "BANK":
        return <Building2 className="size-4" />;
      case "E_WALLET":
        return <Wallet className="size-4" />;
      case "CASH":
        return <Banknote className="size-4" />;
      default:
        return <Wallet className="size-4" />;
    }
  };

  const vaultAccentColor = vault.color || "#3B82F6";

  return (
    <Card className="flex flex-col justify-between transition-all duration-200 hover:shadow-md border-border/80 relative group overflow-hidden bg-card/90">
      {/* Top Accent Color Bar */}
      <div
        className="h-1 w-full absolute top-0 left-0 right-0"
        style={{ backgroundColor: vaultAccentColor }}
      />

      <CardHeader className="pb-2 pt-4 px-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          {/* Account Title and Provider Details */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="flex size-7.5 shrink-0 items-center justify-center rounded-lg text-white shadow-2xs"
              style={{ backgroundColor: vaultAccentColor }}
            >
              {getProviderIcon()}
            </span>
            <div className="min-w-0">
              <CardTitle className="text-base font-bold text-foreground truncate">
                {vault.name}
              </CardTitle>
              <CardDescription className="text-[11px] flex items-center gap-1 font-medium mt-0.5">
                <span>{vault.providerName}</span>
                <span>•</span>
                <span className="capitalize">
                  {vault.accountType.toLowerCase().replace("_", " ")}
                </span>
              </CardDescription>
            </div>
          </div>

          {/* Action Menu (Edit, Delete) */}
          <div className="flex items-center gap-1 shrink-0">
            {vault.isDefault && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                <CheckCircle2 className="size-3" />
                Primary
              </span>
            )}

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
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => onEdit(vault)}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <Pencil className="size-3.5" />
                  Edit Vault
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateBalance(vault)}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <RefreshCw className="size-3.5" />
                  Update Balance
                </DropdownMenuItem>
                {!vault.isDefault && (
                  <DropdownMenuItem
                    onClick={() => onSetDefault(vault)}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Set as Default
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(vault)}
                  className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  Delete Vault
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Nominal Balance & Update Balance Action */}
        <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Current Balance
            </span>
            <div className="text-base font-bold tracking-tight text-foreground font-mono">
              {formattedBalance}
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateBalance(vault)}
            className="gap-1.5 text-[11px] font-medium h-7 px-2.5 hover:bg-primary hover:text-primary-foreground transition-colors shrink-0 cursor-pointer shadow-2xs"
          >
            <RefreshCw className="size-3" />
            Update Balance
          </Button>
        </div>
      </CardHeader>

      {/* Middle Single-Line Balance Trajectory Chart */}
      <CardContent className="py-1 px-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium px-0.5">
            <span className="font-semibold text-foreground/80">Balance History</span>
            <span className="font-mono text-[10px] text-muted-foreground">Monthly</span>
          </div>

          <ChartLineDefault
            showCard={false}
            scrollable={false}
            data={chartData}
            config={chartConfig}
            dataKey="balance"
            xAxisKey="month"
            lineType="monotone"
            strokeColor={vaultAccentColor}
            strokeWidth={2}
            showDots={false}
            gridOpacity={0.3}
            gridDashArray="3 3"
            chartClassName="h-[105px] w-full aspect-auto"
            margin={{ top: 6, left: 4, right: 4, bottom: 2 }}
            tooltipCursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            customTooltipFormatter={(value, name, item) => {
              const payload = (item as { payload?: TooltipPayloadData } | undefined)?.payload;
              const income = payload?.income ?? 0;
              const expense = payload?.expense ?? 0;
              const net = payload?.net ?? (Number(value) - 0);
              return (
                <div className="space-y-1 min-w-[150px]">
                  <div className="text-[11px] font-semibold text-muted-foreground border-b border-border/40 pb-0.5">
                    {payload?.fullMonth || payload?.month} {payload?.year}
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">Balance:</span>
                    <span className="font-mono font-bold text-foreground">
                      {formatCurrency(Number(value))}
                    </span>
                  </div>
                  {payload && (income > 0 || expense > 0) && (
                    <div className="space-y-0.5 pt-1 border-t border-border/40 text-[10px]">
                      {income > 0 && (
                        <div className="flex items-center justify-between gap-2 text-emerald-600 dark:text-emerald-400">
                          <span className="text-muted-foreground">Total Deposit:</span>
                          <span className="font-mono font-semibold">+{formatCurrency(income)}</span>
                        </div>
                      )}
                      {expense > 0 && (
                        <div className="flex items-center justify-between gap-2 text-rose-600 dark:text-rose-400">
                          <span className="text-muted-foreground">Total Withdraw:</span>
                          <span className="font-mono font-semibold">-{formatCurrency(expense)}</span>
                        </div>
                      )}
                      {income > 0 && expense > 0 && (
                        <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-border/20 font-bold">
                          <span className="text-muted-foreground">Net Movement:</span>
                          <span
                            className={`font-mono ${
                              net >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {net >= 0 ? "+" : ""}
                            {formatCurrency(net)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }}
          />
        </div>
      </CardContent>

      {/* Footer with Vs Last Month Trend & View Details Link */}
      <CardFooter className="flex items-center justify-between border-t border-border/50 py-2.5 px-4 text-xs">
        <div className="flex items-center gap-1 font-medium text-muted-foreground text-[11px]">
          {isVsLastMonthUp ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              <TrendingUp className="size-3" />
              {formattedVsLastMonth}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold font-mono">
              <TrendingDown className="size-3" />
              {formattedVsLastMonth}
            </span>
          )}
          <span>vs last month</span>
        </div>

        {/* View Details Link */}
        <Link
          href={`/dashboard/vaults/${vault.id}`}
          className="group/link inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          <span>View Details</span>
          <ArrowRight className="size-3 transition-transform group-hover/link:translate-x-0.5" />
        </Link>
      </CardFooter>
    </Card>
  );
}
