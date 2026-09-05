"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { BankVault, Transaction, api } from "@/lib/api";
import { useTransactionStore } from "@/stores/transaction-store";
import { CategorySelect } from "@/components/category-select";
import { LabelCombobox } from "@/components/label-combobox";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Loader2Icon,
  RefreshCwIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  CalendarIcon,
  SlidersHorizontalIcon,
  HistoryIcon,
  AlertCircleIcon,
} from "lucide-react";

interface UpdateBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vault?: BankVault | null;
  account?: BankVault | null;
  onSuccess: (updatedVault: BankVault) => void;
}

interface UpdateBalanceFormProps {
  account: BankVault;
  onSuccess: (updatedAccount: BankVault) => void;
  onClose: () => void;
}

const EMPTY_TRANSACTIONS: Transaction[] = [];

function UpdateBalanceForm({
  account,
  onSuccess,
  onClose,
}: UpdateBalanceFormProps) {
  const maxPastDate = useMemo(() => {
    // Past date is fixed relative to when the account was created (account.createdAt)
    // E.g., if created on Aug 18, the max past date is Aug 17 (17 and earlier)
    if (account.createdAt) {
      const createdDate = new Date(account.createdAt);
      const prevDate = new Date(
        createdDate.getFullYear(),
        createdDate.getMonth(),
        createdDate.getDate() - 1
      );
      const year = prevDate.getFullYear();
      const month = String(prevDate.getMonth() + 1).padStart(2, "0");
      const day = String(prevDate.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, [account.createdAt]);

  // Mode: "adjust" (Add/Subtract for today) vs "set" (Set past historical balance)
  const [mode, setMode] = useState<"adjust" | "set">("adjust");

  // Adjust Mode state (For Today)
  const [adjustType, setAdjustType] = useState<"add" | "subtract">("add");
  const [adjustAmount, setAdjustAmount] = useState<string>("");
  const [adjustCategory, setAdjustCategory] = useState<string>("salary_income");
  const [adjustLabels, setAdjustLabels] = useState<string[]>([]);

  // Set Past Balance Mode state
  const [newTotalBalance, setNewTotalBalance] = useState<string>(
    account.balance?.toString() || "0"
  );
  const [pastDate, setPastDate] = useState<string>(maxPastDate);
  const [pastCategory, setPastCategory] = useState<string>("other_income");
  const [pastLabels, setPastLabels] = useState<string[]>([]);

  // Existing transactions list from Zustand store to compute historical baseline
  const accountTransactions = useTransactionStore(
    (state) => state.transactionsByAccount[account.id]
  );
  const existingTxs = accountTransactions ?? EMPTY_TRANSACTIONS;
  const fetchAccountTransactions = useTransactionStore(
    (state) => state.fetchAccountTransactions
  );
  const invalidateAccount = useTransactionStore(
    (state) => state.invalidateAccount
  );

  // Shared state
  const [description, setDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const prevDeltaSignRef = useRef<"positive" | "negative" | null>(null);

  // Lazy fetch transaction history only when user switches to "Set Past Balance" mode
  useEffect(() => {
    if (mode === "set") {
      fetchAccountTransactions(account.id);
    }
  }, [mode, account.id, fetchAccountTransactions]);

  // Prior balance & previous recorded date accumulated before the selected past date
  const { priorBalanceBeforePastDate, priorDateLabel } = useMemo(() => {
    if (!pastDate) {
      return { priorBalanceBeforePastDate: 0, priorDateLabel: "Balance before selected date:" };
    }

    const targetDateTime = new Date(pastDate + "T00:00:00").getTime();
    let prior = 0;
    let lastTxDate: string | null = null;

    // Filter and sort transactions strictly before the selected date
    const txsBefore = existingTxs
      .filter((tx) => {
        if (tx.notes?.includes("isHistoricalTransition")) return false;
        if (tx.description?.startsWith("Adjustment transition to current balance")) return false;
        return new Date(tx.date).getTime() < targetDateTime;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const tx of txsBefore) {
      const amt = Math.abs(tx.amount);
      if (tx.type === "INCOME" || tx.amount > 0) {
        prior += amt;
      } else if (tx.type === "EXPENSE" || tx.amount < 0) {
        prior -= amt;
      }
      lastTxDate = tx.date;
    }

    let label = "Balance before " + new Date(pastDate + "T00:00:00").toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    if (lastTxDate) {
      const formattedLastDate = new Date(lastTxDate).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      label = `Balance on ${formattedLastDate}`;
    }

    return {
      priorBalanceBeforePastDate: Math.max(0, prior),
      priorDateLabel: label + ":",
    };
  }, [pastDate, existingTxs]);

  // Next recorded date comparison (e.g. 17 Aug when selecting 16 Aug, or Today when selecting 17 Aug)
  const { nextDateLabel, nextBalance, movementToNext, isNextToday } = useMemo(() => {
    if (!pastDate || !account) return { nextDateLabel: "", nextBalance: 0, movementToNext: 0, isNextToday: true };

    const targetDateTime = new Date(pastDate + "T23:59:59").getTime();
    const currentBal = account.balance || 0;
    const numNewTotal = parseFloat(newTotalBalance.replace(/[^0-9.-]+/g, "")) || 0;

    // Find earliest recorded transaction strictly after pastDate
    const defaultDepositDesc = `Deposit / Top-up to ${account.name}`;
    const txsAfter = existingTxs
      .filter((tx) => {
        if (tx.notes?.includes("isHistoricalTransition")) return false;
        if (tx.description?.startsWith("Adjustment transition to current balance")) return false;
        if (tx.description === defaultDepositDesc) return false;
        return new Date(tx.date).getTime() > targetDateTime;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let nextLabel = "Today";
    let nextBal = currentBal;
    let isToday = true;

    if (txsAfter.length > 0) {
      const firstAfter = txsAfter[0];
      const d = new Date(firstAfter.date);
      nextLabel = d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      isToday = false;

      // Calculate balance on that next recorded point
      let cum = 0;
      for (const tx of existingTxs) {
        if (tx.notes?.includes("isHistoricalTransition")) continue;
        if (tx.description?.startsWith("Adjustment transition to current balance")) continue;
        if (tx.description === defaultDepositDesc) continue;
        if (new Date(tx.date).getTime() <= new Date(firstAfter.date).getTime()) {
          const amt = Math.abs(tx.amount);
          if (tx.type === "INCOME" || tx.amount > 0) cum += amt;
          else if (tx.type === "EXPENSE" || tx.amount < 0) cum -= amt;
        }
      }
      nextBal = Math.max(0, cum);
    }

    const movement = nextBal - numNewTotal;

    return {
      nextDateLabel: nextLabel,
      nextBalance: nextBal,
      movementToNext: movement,
      isNextToday: isToday,
    };
  }, [pastDate, existingTxs, account, newTotalBalance]);

  const currentBal = account?.balance || 0;
  const numAdjust = parseFloat(adjustAmount.replace(/[^0-9.-]+/g, "")) || 0;
  const numNewTotal = parseFloat(newTotalBalance.replace(/[^0-9.-]+/g, "")) || 0;

  // Calculated balance for Mode 1 (Add/Subtract)
  const calculatedAdjustBalance =
    adjustType === "add" ? currentBal + numAdjust : currentBal - numAdjust;

  // Delta required on this past date
  const pastDelta = numNewTotal - priorBalanceBeforePastDate;

  const handleModeChange = (newMode: "adjust" | "set") => {
    setMode(newMode);
    setErrorMessage("");
    if (newMode === "set") {
      const nextDelta = numNewTotal - priorBalanceBeforePastDate;
      const nextSign = nextDelta >= 0 ? "positive" : "negative";
      prevDeltaSignRef.current = nextSign;
      setPastCategory(nextSign === "positive" ? "other_income" : "food_beverage");
    } else {
      prevDeltaSignRef.current = null;
    }
  };

  const handleNewTotalBalanceChange = (val: string) => {
    setNewTotalBalance(val);
    const nextValNum = parseFloat(val.replace(/[^0-9.-]+/g, "")) || 0;
    const nextDelta = nextValNum - priorBalanceBeforePastDate;
    const currentSign = nextDelta >= 0 ? "positive" : "negative";
    if (prevDeltaSignRef.current !== currentSign) {
      prevDeltaSignRef.current = currentSign;
      setPastCategory(currentSign === "positive" ? "other_income" : "food_beverage");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: account?.currency || "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    setIsLoading(true);
    try {
      if (mode === "adjust") {
        // --- MODE 1: ADD / SUBTRACT (For Today, No Date Needed) ---
        if (!adjustAmount || numAdjust <= 0) {
          setErrorMessage("Please enter a valid amount greater than 0");
          setIsLoading(false);
          return;
        }

        if (adjustType === "subtract" && calculatedAdjustBalance < 0) {
          setErrorMessage(
            `Insufficient balance. Current balance is only ${formatCurrency(
              currentBal
            )}, and cannot become negative.`
          );
          setIsLoading(false);
          return;
        }

        const defaultDesc =
          adjustType === "add"
            ? `Deposit / Top-up to ${account.name}`
            : `Withdrawal / Expense from ${account.name}`;

        await api.createTransaction({
          accountId: account.id,
          amount: numAdjust,
          type: adjustType === "add" ? "INCOME" : "EXPENSE",
          date: new Date().toISOString(),
          description: description.trim() || defaultDesc,
          category: adjustCategory,
          labels: adjustLabels,
          adjustBalance: true,
        });
      } else {
        // --- MODE 2: SET PAST BALANCE (Past Date Required, Cannot Be on or After Creation Date) ---
        if (!pastDate) {
          setErrorMessage("Please select a past transaction date");
          setIsLoading(false);
          return;
        }

        if (pastDate > maxPastDate) {
          setErrorMessage(
            `Past balance date must be on or before ${maxPastDate} (prior to account creation date).`
          );
          setIsLoading(false);
          return;
        }

        if (numNewTotal < 0) {
          setErrorMessage("Past balance cannot be negative (minimum 0)");
          setIsLoading(false);
          return;
        }

        // 1. Identify all historical adjustments in the account
        interface HistoricalTarget {
          dateStr: string; // YYYY-MM-DD
          targetBalance: number;
          txId?: string;
          userDescription?: string;
        }

        const targetsMap = new Map<string, HistoricalTarget>();

        // Collect existing adjustments
        for (const tx of existingTxs) {
          const d = new Date(tx.date);
          const dKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
          ).padStart(2, "0")}`;

          let isAdj = false;
          let targetBal = 0;

          if (tx.notes) {
            try {
              const p = JSON.parse(tx.notes);
              if (p?.isHistoricalAdjustment && typeof p.targetBalance === "number") {
                isAdj = true;
                targetBal = p.targetBalance;
              }
            } catch { }
          }

          if (!isAdj && tx.description?.startsWith("Historical balance adjustment")) {
            isAdj = true;
            // If targetBalance wasn't in notes, extract or calculate baseline
            const match = tx.description.match(/Historical balance adjustment \(([+-])(?:Rp\s*)?([0-9.,]+)\)/);
            if (match) {
              const sign = match[1] === "-" ? -1 : 1;
              const val = parseFloat(match[2].replace(/[^0-9.-]+/g, "")) || 0;
              targetBal = Math.max(0, val * sign);
            }
          }

          if (!isAdj && tx.description?.startsWith("Initial balance on")) {
            isAdj = true;
            targetBal = Math.abs(tx.amount);
          }

          if (isAdj && dKey !== pastDate) {
            targetsMap.set(dKey, {
              dateStr: dKey,
              targetBalance: targetBal,
              txId: tx.id,
              userDescription: tx.description,
            });
          }
        }

        // Add or overwrite the target for current selected pastDate
        targetsMap.set(pastDate, {
          dateStr: pastDate,
          targetBalance: numNewTotal,
          userDescription: description.trim() || undefined,
        });

        const defaultDepositDesc = `Deposit / Top-up to ${account.name}`;

        // 2. Regular non-adjustment transactions (excluding placeholder initial setup deposits)
        const regularTxs = existingTxs.filter((tx) => {
          const d = new Date(tx.date);
          const dKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
          ).padStart(2, "0")}`;

          if (dKey === pastDate) return false;
          if (tx.notes?.includes("isHistoricalAdjustment")) return false;
          if (tx.notes?.includes("isHistoricalTransition")) return false;
          if (tx.description?.startsWith("Historical balance adjustment")) return false;
          if (tx.description?.startsWith("Adjustment transition to current balance")) return false;
          if (tx.description?.startsWith("Historical balance adjustment transition")) return false;
          if (tx.description?.startsWith("Initial balance on")) return false;
          if (tx.description === defaultDepositDesc) return false;
          return true;
        });

        // Clean up redundant default initial top-up transactions created on today when establishing past baseline
        const redundantInitialDeposits = existingTxs.filter((tx) => {
          return (
            tx.description === defaultDepositDesc &&
            !tx.notes?.includes("isHistoricalAdjustment") &&
            !tx.notes?.includes("isHistoricalTransition")
          );
        });
        for (const redTx of redundantInitialDeposits) {
          try {
            await api.deleteTransaction(redTx.id, false);
          } catch (e) {
            console.error("Failed to delete redundant setup deposit:", e);
          }
        }

        // Delete existing historical adjustment on pastDate if any to prevent duplicates
        const sameDayOldTxs = existingTxs.filter((tx) => {
          const d = new Date(tx.date);
          const dKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
          ).padStart(2, "0")}`;
          if (dKey !== pastDate) return false;
          return (
            tx.notes?.includes("isHistoricalAdjustment") ||
            tx.notes?.includes("isHistoricalTransition") ||
            tx.description?.startsWith("Historical balance adjustment") ||
            tx.description?.startsWith("Adjustment transition to current balance") ||
            tx.description?.startsWith("Historical balance adjustment transition") ||
            tx.description?.startsWith("Initial balance on")
          );
        });
        for (const oldTx of sameDayOldTxs) {
          try {
            await api.deleteTransaction(oldTx.id, false);
          } catch (e) {
            console.error("Failed to delete older tx on same date:", e);
          }
        }

        // 3. Sort all historical adjustment targets chronologically
        const sortedTargetDates = Array.from(targetsMap.keys()).sort();

        // Calculate and apply deltas chronologically so that every date maintains its target
        let cumulativeAdjusted = 0;

        for (const dKey of sortedTargetDates) {
          const target = targetsMap.get(dKey)!;
          const targetDateTime = new Date(dKey + "T00:00:00").getTime();

          // All regular txs up to this date
          let regularSum = 0;
          for (const reg of regularTxs) {
            const regTime = new Date(reg.date).getTime();
            if (regTime < targetDateTime) {
              const amt = Math.abs(reg.amount);
              if (reg.type === "INCOME" || reg.amount > 0) regularSum += amt;
              else if (reg.type === "EXPENSE" || reg.amount < 0) regularSum -= amt;
            }
          }

          const priorBal = Math.max(0, cumulativeAdjusted + regularSum);
          const requiredDelta = target.targetBalance - priorBal;

          const isIncome = requiredDelta >= 0;
          const deltaAmount = Math.abs(requiredDelta);
          const isEstablishingInitial = dKey === sortedTargetDates[0] && priorBal === 0;

          const histCategory = isEstablishingInitial
            ? "other_income"
            : isIncome
              ? (pastCategory.includes("income") ? pastCategory : "other_income")
              : (pastCategory.includes("expense") || !pastCategory.includes("income") ? pastCategory : "other_expense");
          const histLabels = isEstablishingInitial ? [] : pastLabels;
          const histDesc = isEstablishingInitial
            ? `Initial balance on ${dKey}`
            : target.userDescription &&
                !target.userDescription.startsWith("Historical balance adjustment") &&
                !target.userDescription.startsWith("Initial balance on")
              ? target.userDescription
              : `Historical balance adjustment (${isIncome ? "+" : "-"}${formatCurrency(
                deltaAmount
              )}) on ${dKey}`;

          const notesContent = JSON.stringify({
            isHistoricalAdjustment: true,
            targetBalance: target.targetBalance,
          });

          if (target.txId && dKey !== pastDate) {
            // Re-adjust existing subsequent adjustment transaction
            if (deltaAmount === 0) {
              await api.deleteTransaction(target.txId, false);
            } else {
              await api.updateTransaction(target.txId, {
                amount: deltaAmount,
                type: isIncome ? "INCOME" : "EXPENSE",
                description: histDesc,
                category: histCategory,
                labels: histLabels,
                notes: notesContent,
                adjustBalance: false,
              });
            }
          } else {
            // Create new adjustment transaction on pastDate
            if (deltaAmount !== 0) {
              await api.createTransaction({
                accountId: account.id,
                amount: deltaAmount,
                type: isIncome ? "INCOME" : "EXPENSE",
                date: new Date(dKey + "T12:00:00").toISOString(),
                description: histDesc,
                category: histCategory,
                labels: histLabels,
                notes: notesContent,
                adjustBalance: false,
              });
            }
          }

          // Advance cumulative adjusted balance to the target for subsequent dates
          cumulativeAdjusted = target.targetBalance;
        }

        // 4. Create or update balancing transition transaction from the latest historical target to current balance
        const existingTransitionTx = existingTxs.find((tx) => {
          if (tx.notes) {
            try {
              const p = JSON.parse(tx.notes);
              if (p?.isHistoricalTransition) return true;
            } catch { }
          }
          return (
            tx.description?.startsWith("Adjustment transition to current balance") ||
            tx.description?.startsWith("Historical balance adjustment transition")
          );
        });

        const lastTargetDate = sortedTargetDates[sortedTargetDates.length - 1];
        const lastTargetDateTime = new Date(lastTargetDate + "T23:59:59").getTime();

        let regularAfterSum = 0;
        for (const reg of regularTxs) {
          const regTime = new Date(reg.date).getTime();
          if (regTime > lastTargetDateTime) {
            const amt = Math.abs(reg.amount);
            if (reg.type === "INCOME" || reg.amount > 0) regularAfterSum += amt;
            else if (reg.type === "EXPENSE" || reg.amount < 0) regularAfterSum -= amt;
          }
        }

        const currentComputedBal = cumulativeAdjusted + regularAfterSum;
        const requiredTransitionDelta = currentBal - currentComputedBal;
        const transitionAmount = Math.abs(requiredTransitionDelta);
        const isTransitionIncome = requiredTransitionDelta >= 0;

        if (transitionAmount === 0) {
          if (existingTransitionTx) {
            try {
              await api.deleteTransaction(existingTransitionTx.id, false);
            } catch (e) {
              console.error("Failed to delete unused transition tx:", e);
            }
          }
        } else {
          const transCategory = isTransitionIncome ? "other_income" : "other_expense";
          const transLabels = pastLabels;
          const transDesc =
            description.trim() ||
            `Adjustment transition to current balance (${isTransitionIncome ? "+" : "-"
            }${formatCurrency(transitionAmount)})`;

          const transitionNotes = JSON.stringify({
            isHistoricalTransition: true,
            targetBalance: currentBal,
          });

          if (existingTransitionTx) {
            await api.updateTransaction(existingTransitionTx.id, {
              amount: transitionAmount,
              type: isTransitionIncome ? "INCOME" : "EXPENSE",
              description: transDesc,
              category: transCategory,
              labels: transLabels,
              date: new Date().toISOString(),
              notes: transitionNotes,
              adjustBalance: false,
            });
          } else {
            await api.createTransaction({
              accountId: account.id,
              amount: transitionAmount,
              type: isTransitionIncome ? "INCOME" : "EXPENSE",
              date: new Date().toISOString(),
              description: transDesc,
              category: transCategory,
              labels: transLabels,
              notes: transitionNotes,
              adjustBalance: false,
            });
          }
        }
      }

      // Invalidate transaction store cache for this account so next fetch is fresh
      invalidateAccount(account.id);

      // Fetch the updated vault with fresh balance and stats
      const updatedAccRes = await api.getVaultById(account.id);
      onSuccess(updatedAccRes.vault);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update account balance";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DialogHeader className="gap-1.5">
        <DialogTitle className="flex items-center gap-2 text-base font-bold">
          <RefreshCwIcon className="size-4 text-primary" />
          Update Balance: {account.name}
        </DialogTitle>
        <DialogDescription>
          Current balance:{" "}
          <span className="font-semibold text-foreground">
            {formatCurrency(currentBal)}
          </span>
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-3 pt-0.5">
        {errorMessage && (
          <Alert variant="destructive" className="animate-in fade-in-50">
            <AlertCircleIcon className="size-4 shrink-0" />
            <AlertTitle className="font-semibold">Something went wrong</AlertTitle>
            <AlertDescription className="text-xs text-destructive/90">{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Mode Switcher: Add / Subtract (Today) vs Set Past Balance */}
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/80 p-1 border border-border/50">
          <Button
            type="button"
            variant={mode === "adjust" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => handleModeChange("adjust")}
            className={`flex items-center justify-center gap-1.5 h-7.5 text-xs font-semibold ${mode === "adjust"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-transparent"
              }`}
          >
            <SlidersHorizontalIcon className="size-3.5" />
            Add / Subtract (Today)
          </Button>
          <Button
            type="button"
            variant={mode === "set" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => handleModeChange("set")}
            className={`flex items-center justify-center gap-1.5 h-7.5 text-xs font-semibold ${mode === "set"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-transparent"
              }`}
          >
            <HistoryIcon className="size-3.5" />
            Set Past Balance
          </Button>
        </div>

        {/* ======================================================== */}
        {/* MODE 1: ADD / SUBTRACT (For Today, No Date Picker)        */}
        {/* ======================================================== */}
        {mode === "adjust" && (
          <div className="space-y-3.5">
            {/* Type Switcher: Add vs Subtract */}
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                type="button"
                variant={adjustType === "add" ? "secondary" : "outline"}
                onClick={() => {
                  setAdjustType("add");
                  setAdjustCategory((prev) =>
                    [
                      "food_beverage",
                      "transportation",
                      "shopping",
                      "housing_utilities",
                      "health",
                      "beauty",
                      "education",
                      "entertainment",
                      "gift_donation",
                      "other_expense",
                    ].includes(prev)
                      ? "salary_income"
                      : prev
                  );
                }}
                className={`flex items-center justify-center gap-1.5 h-9 text-xs font-semibold ${adjustType === "add"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                  : "border-border bg-card/50 text-muted-foreground hover:bg-accent/40"
                  }`}
              >
                <ArrowUpRightIcon className="size-3.5" />
                Deposit (+)
              </Button>
              <Button
                type="button"
                variant={adjustType === "subtract" ? "secondary" : "outline"}
                onClick={() => {
                  setAdjustType("subtract");
                  setAdjustCategory((prev) =>
                    [
                      "salary_income",
                      "side_income",
                      "savings_investment",
                      "other_income",
                    ].includes(prev)
                      ? "food_beverage"
                      : prev
                  );
                }}
                className={`flex items-center justify-center gap-1.5 h-9 text-xs font-semibold ${adjustType === "subtract"
                  ? "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                  : "border-border bg-card/50 text-muted-foreground hover:bg-accent/40"
                  }`}
              >
                <ArrowDownRightIcon className="size-3.5" />
                Withdrawal (-)
              </Button>
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <Label htmlFor="adjust-amount" className="text-xs font-semibold">
                {adjustType === "add" ? "Deposit Amount" : "Withdrawal Amount"}
              </Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="adjust-amount"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="pl-8 text-sm"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {/* Description Input */}
            <div className="space-y-1.5">
              <Label htmlFor="adjust-tx-desc" className="text-xs font-semibold">
                Description
              </Label>
              <Input
                id="adjust-tx-desc"
                type="text"
                placeholder={
                  adjustType === "add"
                    ? "e.g. Salary, Top-up, Bonus"
                    : "e.g. Shopping, ATM Withdrawal, Bill"
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs"
                maxLength={200}
                disabled={isLoading}
              />
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category</Label>
              <CategorySelect
                value={adjustCategory}
                onChange={setAdjustCategory}
                typeFilter="ALL"
                disabled={isLoading}
              />
            </div>

            {/* Label Dropdown (Combobox with create) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Labels (Optional)</Label>
              <LabelCombobox
                selectedLabels={adjustLabels}
                onChange={setAdjustLabels}
                placeholder="Search or create labels"
                disabled={isLoading}
              />
            </div>

            {/* Balance Preview Card */}
            <div className="rounded-lg bg-card/90 border p-3 text-xs space-y-1.5 shadow-2xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Current Balance:</span>
                <span className="font-mono">{formatCurrency(currentBal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Adjustment:</span>
                <span
                  className={`font-mono font-semibold ${adjustType === "add"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                    }`}
                >
                  {adjustType === "add" ? "+" : "-"}
                  {formatCurrency(numAdjust)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border/50 pt-1.5 font-bold text-foreground">
                <span>Estimated New Balance:</span>
                <span
                  className={`font-mono ${calculatedAdjustBalance < 0
                    ? "text-destructive font-bold"
                    : "text-foreground"
                    }`}
                >
                  {formatCurrency(calculatedAdjustBalance)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 2: SET PAST BALANCE (Requires Past Date)             */}
        {/* ======================================================== */}
        {mode === "set" && (
          <div className="space-y-2.5">
            {/* Target Nominal Input */}
            <div className="space-y-1">
              <Label htmlFor="set-total" className="text-xs font-semibold">
                Past Balance (on Selected Date)
              </Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="set-total"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={newTotalBalance}
                  onChange={(e) => handleNewTotalBalanceChange(e.target.value)}
                  className="pl-8 text-sm font-mono h-8.5"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {/* Past Date Picker (Cannot be on or after account creation date) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="past-date" className="text-xs font-semibold flex items-center gap-1.5">
                  <CalendarIcon className="size-3.5 text-muted-foreground" />
                  Past Date (Historical)
                </Label>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  Max: {new Date(maxPastDate + "T00:00:00").toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })} (prior to creation)
                </span>
              </div>
              <Input
                id="past-date"
                type="date"
                max={maxPastDate}
                value={pastDate}
                onChange={(e) => setPastDate(e.target.value)}
                className="text-xs h-8.5"
                required
                disabled={isLoading}
              />
            </div>

            {/* Description Input */}
            <div className="space-y-1">
              <Label htmlFor="past-tx-desc" className="text-xs font-semibold">
                Description
              </Label>
              <Input
                id="past-tx-desc"
                type="text"
                placeholder="e.g. Initial balance, Historical deposit"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs h-8.5"
                maxLength={200}
                disabled={isLoading}
              />
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Category</Label>
              <CategorySelect
                value={pastCategory}
                onChange={setPastCategory}
                typeFilter="ALL"
                disabled={isLoading}
              />
            </div>

            {/* Label Dropdown (Combobox with create) */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Labels (Optional)</Label>
              <LabelCombobox
                selectedLabels={pastLabels}
                onChange={setPastLabels}
                placeholder="Search or create labels"
                disabled={isLoading}
              />
            </div>

            {/* Auto-detected Adjustment Delta Card Relative to Prior Balance */}
            <div className="rounded-lg bg-card/90 border p-2.5 text-xs space-y-1 shadow-2xs">
              <div className="flex justify-between text-muted-foreground">
                <span>{priorDateLabel}</span>
                <span className="font-mono font-semibold">{formatCurrency(priorBalanceBeforePastDate)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>
                  Balance on{" "}
                  {pastDate
                    ? new Date(pastDate + "T00:00:00").toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                    : "selected date"}
                  :
                </span>
                <span className="font-mono font-bold text-foreground">{formatCurrency(numNewTotal)}</span>
              </div>
              <div className="flex justify-between border-t border-border/50 pt-1">
                <span>Movement on this date:</span>
                <span
                  className={`font-mono font-bold ${pastDelta > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : pastDelta < 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-muted-foreground"
                    }`}
                >
                  {pastDelta > 0
                    ? `+${formatCurrency(pastDelta)} (Deposit)`
                    : pastDelta < 0
                      ? `-${formatCurrency(Math.abs(pastDelta))} (Withdraw)`
                      : "No Adjustment (0)"}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground border-t border-border/30 pt-0.5">
                <span>Balance on {nextDateLabel}:</span>
                <span className="font-mono font-semibold">{formatCurrency(nextBalance)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Movement to {isNextToday ? "Today" : nextDateLabel}:</span>
                <span
                  className={`font-mono font-bold ${movementToNext >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                    }`}
                >
                  {movementToNext >= 0 ? "+" : "-"}
                  {formatCurrency(Math.abs(movementToNext))}
                  {movementToNext >= 0 ? " (Deposit)" : " (Withdraw)"}
                </span>
              </div>
              {!isNextToday && (
                <div className="flex justify-between text-[11px] text-muted-foreground border-t border-border/30 pt-0.5">
                  <span>Balance on Today:</span>
                  <span className="font-mono font-medium">{formatCurrency(currentBal)} (Fixed)</span>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-1.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading && <Loader2Icon className="size-3.5 animate-spin" />}
            {mode === "adjust" ? "Save Balance" : "Record Past Balance"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function UpdateBalanceDialog({
  open,
  onOpenChange,
  vault,
  account,
  onSuccess,
}: UpdateBalanceDialogProps) {
  const targetVault = vault ?? account;
  if (!targetVault) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto p-5">
        {open && (
          <UpdateBalanceForm
            key={targetVault.id}
            account={targetVault}
            onSuccess={onSuccess}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
