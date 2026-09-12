"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { Goal, BankVault, api } from "@/lib/api";
import {
  ArrowDownToLineIcon,
  Loader2Icon,
  AlertCircleIcon,
  WalletCardsIcon,
  Building2Icon,
  WalletIcon,
  BanknoteIcon,
} from "lucide-react";
import { GOAL_CATEGORY_CONFIG } from "@/components/goal-card";

interface WithdrawGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  vaults: BankVault[];
  onSuccess: () => void;
}

export function WithdrawGoalDialog({
  open,
  onOpenChange,
  goal,
  vaults,
  onSuccess,
}: WithdrawGoalDialogProps) {
  const defaultVault = vaults.find((v) => v.isDefault) || vaults[0];
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    defaultVault?.id || ""
  );
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const formatCurrency = useCallback((val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  }, []);

  const selectedVault = useMemo(() => {
    return vaults.find((v) => v.id === selectedAccountId) || null;
  }, [vaults, selectedAccountId]);

  const maxAvailable = goal?.currentAmount || 0;

  const numAmount = parseFloat(amount) || 0;
  const simulatedRemaining = Math.max(0, maxAvailable - numAmount);
  const simulatedPercent = goal?.targetAmount
    ? Math.min(100, Math.round((simulatedRemaining / goal.targetAmount) * 100))
    : 0;

  const isExceeding = numAmount > maxAvailable;

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

  const handleQuickPercent = (pct: number) => {
    const calculated = Math.floor(maxAvailable * (pct / 100));
    setAmount(calculated.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!goal) return;

    if (numAmount <= 0) {
      setErrorMessage("Withdrawal amount must be greater than 0");
      return;
    }

    if (numAmount > maxAvailable) {
      setErrorMessage(
        `Withdrawal amount exceeds current goal savings balance (${formatCurrency(
          maxAvailable
        )})`
      );
      return;
    }

    if (!selectedAccountId) {
      setErrorMessage("Please select a destination vault to receive the funds");
      return;
    }

    try {
      setIsLoading(true);
      await api.withdrawGoal(goal.id, {
        amount: numAmount,
        accountId: selectedAccountId,
      });
      setAmount("");
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to withdraw savings";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!goal) return null;

  const categoryMeta =
    GOAL_CATEGORY_CONFIG[goal.category] || GOAL_CATEGORY_CONFIG.general;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 sm:p-6 max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ArrowDownToLineIcon className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Withdraw Savings
              </DialogTitle>
              <DialogDescription className="text-xs">
                Transfer saved funds from &ldquo;{goal.title}&rdquo; back into your vault.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Goal Savings Summary Box */}
        <div className="rounded-lg border border-border/70 bg-card p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl select-none">{goal.icon || "🎯"}</span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">
                  {goal.title}
                </div>
                <div className="text-[10px] text-muted-foreground capitalize">
                  {categoryMeta.label}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block">
                Available to Withdraw
              </span>
              <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(maxAvailable)}
              </span>
            </div>
          </div>

          {/* Progress After Withdrawal Preview */}
          {numAmount > 0 && !isExceeding && (
            <div className="space-y-1 pt-1 border-t border-border/50 text-[11px]">
              <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                <span>Savings remaining after withdraw:</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatCurrency(simulatedRemaining)} ({simulatedPercent}%)
                </span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {errorMessage && (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertCircleIcon className="size-4 shrink-0" />
              <AlertTitle className="font-semibold">Withdrawal Failed</AlertTitle>
              <AlertDescription className="text-xs text-destructive/90">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="withdraw-amount" className="text-xs font-semibold">
                Withdrawal Amount (IDR)
              </Label>
              <button
                type="button"
                onClick={() => setAmount(maxAvailable.toString())}
                className="text-[10px] font-semibold text-primary hover:underline cursor-pointer"
              >
                Max ({formatCurrency(maxAvailable)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground select-none">
                Rp
              </span>
              <Input
                id="withdraw-amount"
                type="number"
                min="1"
                max={maxAvailable}
                step="any"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`pl-9 text-xs font-mono font-semibold ${
                  isExceeding ? "border-destructive text-destructive" : ""
                }`}
                disabled={isLoading}
                required
              />
            </div>
            {isExceeding && (
              <p className="text-[11px] text-destructive font-medium">
                Amount exceeds current savings balance ({formatCurrency(maxAvailable)}).
              </p>
            )}

            {/* Quick Percentage Chips */}
            {maxAvailable > 0 && (
              <div className="flex items-center gap-1.5 pt-1">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickPercent(pct)}
                    className="flex-1 rounded-md border border-border/70 bg-muted/40 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    {pct === 100 ? "All (100%)" : `${pct}%`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Destination Vault Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="dest-vault" className="text-xs font-semibold">
              Destination Vault / Account
            </Label>
            {vaults.length === 0 ? (
              <p className="text-xs text-destructive">
                No vaults available. Please create a vault first.
              </p>
            ) : (
              <Select
                value={selectedAccountId}
                onValueChange={(val) => val && setSelectedAccountId(val)}
                disabled={isLoading}
              >
                <SelectTrigger id="dest-vault" className="w-full bg-card text-xs cursor-pointer">
                  <SelectValue placeholder="Select destination account">
                    {selectedVault ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="flex size-3.5 items-center justify-center rounded text-white shrink-0"
                          style={{ backgroundColor: selectedVault.color || "#3B82F6" }}
                        >
                          {getProviderIcon(selectedVault.providerType)}
                        </span>
                        <span className="font-medium text-xs text-foreground truncate">
                          {selectedVault.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                          Balance: {formatCurrency(selectedVault.balance)}
                        </span>
                      </div>
                    ) : (
                      "Select destination account"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} side="bottom" align="start">
                  <SelectGroup>
                    {vaults.map((vault) => (
                      <SelectItem key={vault.id} value={vault.id} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex size-3.5 items-center justify-center rounded text-white shrink-0"
                            style={{ backgroundColor: vault.color || "#3B82F6" }}
                          >
                            {getProviderIcon(vault.providerType)}
                          </span>
                          <span className="font-medium text-xs">{vault.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                            {formatCurrency(vault.balance)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
            <p className="text-[10px] text-muted-foreground">
              Withdrawn funds will be added directly to this vault&apos;s balance.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || isExceeding || numAmount <= 0 || !selectedAccountId}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              {isLoading && <Loader2Icon className="size-3.5 animate-spin" />}
              <span>
                Withdraw {numAmount > 0 ? formatCurrency(numAmount) : ""}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
