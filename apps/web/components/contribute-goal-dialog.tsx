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
  CoinsIcon,
  Loader2Icon,
  AlertCircleIcon,
  WalletCardsIcon,
  SparklesIcon,
} from "lucide-react";
import { GOAL_CATEGORY_CONFIG } from "@/components/goal-card";

interface ContributeGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  vaults: BankVault[];
  onSuccess: () => void;
}

export function ContributeGoalDialog({
  open,
  onOpenChange,
  goal,
  vaults,
  onSuccess,
}: ContributeGoalDialogProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    vaults[0]?.id || ""
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

  const remainingNeeded = useMemo(() => {
    if (!goal) return 0;
    return Math.max(0, goal.targetAmount - goal.currentAmount);
  }, [goal]);

  const quickPills = useMemo(() => {
    const list = [25000, 50000, 100000, 500000, 1000000];
    return list.filter((val) => remainingNeeded <= 0 || val <= remainingNeeded * 2);
  }, [remainingNeeded]);

  if (!goal) return null;

  const categoryMeta =
    GOAL_CATEGORY_CONFIG[goal.category] || GOAL_CATEGORY_CONFIG.general;

  const currentPercent = Math.min(
    100,
    Math.round((goal.currentAmount / goal.targetAmount) * 100)
  );

  const numAmount = parseFloat(amount) || 0;
  const simulatedTotal = goal.currentAmount + numAmount;
  const simulatedPercent = Math.min(
    100,
    Math.round((simulatedTotal / goal.targetAmount) * 100)
  );

  const isInsufficient = selectedVault
    ? numAmount > selectedVault.balance
    : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (numAmount <= 0) {
      setErrorMessage("Contribution amount must be greater than 0");
      return;
    }

    if (selectedVault && numAmount > selectedVault.balance) {
      setErrorMessage(
        `Insufficient balance in ${selectedVault.name}. Current balance: ${formatCurrency(
          selectedVault.balance
        )}`
      );
      return;
    }

    try {
      setIsLoading(true);
      await api.contributeGoal(goal.id, {
        amount: numAmount,
        accountId: selectedAccountId || undefined,
      });
      setAmount("");
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to contribute to goal";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CoinsIcon className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Add Savings to Goal
              </DialogTitle>
              <DialogDescription className="text-xs">
                Allocate funds from your vault towards &ldquo;{goal.title}&rdquo;.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Goal Progress Summary Box */}
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
              <span className="font-mono text-xs font-bold text-primary">
                {currentPercent}%
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
              </span>
            </div>
          </div>

          {/* Progress preview */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden relative">
              <div
                className="h-full bg-primary/50 rounded-full transition-all duration-300"
                style={{ width: `${currentPercent}%` }}
              />
              {numAmount > 0 && (
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300 absolute top-0 left-0 opacity-80"
                  style={{ width: `${simulatedPercent}%` }}
                />
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Remaining: {formatCurrency(remainingNeeded)}</span>
              {numAmount > 0 && (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  New Progress: {simulatedPercent}%
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {errorMessage && (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertCircleIcon className="size-4 shrink-0" />
              <AlertTitle className="font-semibold">Something went wrong</AlertTitle>
              <AlertDescription className="text-xs text-destructive/90">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Source Vault Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="source-vault" className="text-xs font-semibold">
              Source Vault / Account
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
                <SelectTrigger id="source-vault" className="w-full bg-card text-xs cursor-pointer">
                  <SelectValue placeholder="Select source account">
                    {(() => {
                      const v = vaults.find((vault) => vault.id === selectedAccountId);
                      if (!v) return "Select source account";
                      return (
                        <div className="flex items-center gap-2">
                          <WalletCardsIcon className="size-3.5 text-muted-foreground" />
                          <span className="font-medium text-xs text-foreground">{v.name}</span>
                        </div>
                      );
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} side="bottom" align="start">
                  <SelectGroup>
                    {vaults.map((vault) => (
                      <SelectItem key={vault.id} value={vault.id} className="cursor-pointer">
                        <div className="flex items-center justify-between w-full gap-4 py-0.5">
                          <div className="flex items-center gap-2">
                            <WalletCardsIcon className="size-3.5 text-muted-foreground" />
                            <span className="font-medium text-xs">{vault.name}</span>
                          </div>
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {formatCurrency(vault.balance)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
            {selectedVault && (
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
                <span>Available Balance:</span>
                <span
                  className={`font-mono font-semibold ${
                    isInsufficient
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-foreground"
                  }`}
                >
                  {formatCurrency(selectedVault.balance)}
                </span>
              </div>
            )}
          </div>

          {/* Contribution Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="deposit-amount" className="text-xs font-semibold">
              Deposit Amount <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                Rp
              </span>
              <Input
                id="deposit-amount"
                type="number"
                min="1"
                step="any"
                placeholder="e.g. 250000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`pl-9 font-mono ${
                  isInsufficient ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium">
              Quick Presets
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {quickPills.map((p) => (
                <Button
                  key={p}
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => setAmount(p.toString())}
                  className="h-7 text-[11px] font-mono cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                  disabled={isLoading}
                >
                  +{formatCurrency(p)}
                </Button>
              ))}
              {remainingNeeded > 0 && (
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  onClick={() => setAmount(remainingNeeded.toString())}
                  className="h-7 text-[11px] font-semibold gap-1 text-primary cursor-pointer hover:bg-primary/20"
                  disabled={isLoading}
                >
                  <SparklesIcon className="size-3" />
                  Fill Remaining
                </Button>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || numAmount <= 0 || isInsufficient}
              className="gap-2 cursor-pointer font-semibold"
            >
              {isLoading && <Loader2Icon className="size-3.5 animate-spin" />}
              Deposit Savings
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
