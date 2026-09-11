"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CategorySelect } from "@/components/category-select";
import { LabelCombobox } from "@/components/label-combobox";
import { BankVault, Transaction, Budget, api } from "@/lib/api";
import {
  PlusIcon,
  PencilIcon,
  Loader2Icon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  Building2Icon,
  WalletIcon,
  BanknoteIcon,
  AlertCircleIcon,
  CalendarIcon,
  PiggyBankIcon,
} from "lucide-react";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaults: BankVault[];
  budgets?: Budget[];
  defaultBudget?: Budget | null;
  fixedType?: "EXPENSE" | "INCOME";
  transactionToEdit?: Transaction | null;
  defaultAccountId?: string;
  onSuccess: (transaction: Transaction) => void;
}

export function TransactionDialog({
  open,
  onOpenChange,
  vaults = [],
  budgets = [],
  defaultBudget,
  fixedType,
  transactionToEdit,
  defaultAccountId,
  onSuccess,
}: TransactionDialogProps) {
  const isEditing = !!transactionToEdit;

  const [accountId, setAccountId] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("food_beverage");
  const [labels, setLabels] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [adjustBalance, setAdjustBalance] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [internalBudgets, setInternalBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    if (open && (!budgets || budgets.length === 0)) {
      api.getBudgets()
        .then((res) => {
          if (res.budgets) setInternalBudgets(res.budgets);
        })
        .catch(() => {});
    }
  }, [open, budgets]);

  const allAvailableBudgets = useMemo(() => {
    const sourceList = (budgets && budgets.length > 0) ? budgets : internalBudgets;
    const list = [...sourceList];
    if (defaultBudget && !list.some((b) => b.id === defaultBudget.id)) {
      list.unshift(defaultBudget);
    }
    return list;
  }, [budgets, internalBudgets, defaultBudget]);

  useEffect(() => {
    if (open) {
      setErrorMessage("");
      if (transactionToEdit) {
        setAccountId(transactionToEdit.accountId);
        const isInc =
          transactionToEdit.type === "INCOME" || transactionToEdit.amount > 0;
        setType(isInc ? "INCOME" : "EXPENSE");
        setAmount(Math.abs(transactionToEdit.amount).toString());
        setDate(
          transactionToEdit.date
            ? transactionToEdit.date.slice(0, 10)
            : new Date().toISOString().slice(0, 10)
        );
        setDescription(transactionToEdit.description || "");
        setCategory(
          transactionToEdit.category ||
            (isInc ? "salary_income" : "food_beverage")
        );
        setLabels(transactionToEdit.labels || []);
        setNotes(transactionToEdit.notes || "");
      } else if (defaultBudget) {
        const initialAccountId =
          defaultAccountId ||
          (vaults.find((v) => v.isDefault)?.id || vaults[0]?.id || "");
        setAccountId(initialAccountId);
        setType("EXPENSE");
        setAmount("");
        setDate(new Date().toISOString().slice(0, 10));
        setDescription("");
        setCategory(defaultBudget.categorySlug || "food_beverage");
        setLabels(defaultBudget.labels || []);
        setNotes("");
        setAdjustBalance(true);
      } else {
        const initialAccountId =
          defaultAccountId ||
          (vaults.find((v) => v.isDefault)?.id || vaults[0]?.id || "");
        setAccountId(initialAccountId);
        setType(fixedType || "EXPENSE");
        setAmount("");
        setDate(new Date().toISOString().slice(0, 10));
        setDescription("");
        setCategory("food_beverage");
        setLabels([]);
        setNotes("");
        setAdjustBalance(true);
      }
    }
  }, [open, transactionToEdit, defaultAccountId, vaults, defaultBudget, fixedType]);

  // Automatically match budget based on the selected category
  const matchedBudget = useMemo(() => {
    if (defaultBudget) return defaultBudget;
    if (type !== "EXPENSE") return null;
    return allAvailableBudgets.find((b) => b.categorySlug === category) || null;
  }, [defaultBudget, type, allAvailableBudgets, category]);

  const isExpenseOnly = fixedType === "EXPENSE" || !!defaultBudget;

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
  };

  const selectedVault = vaults.find((v) => v.id === accountId);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const numAmount = parseFloat(amount.replace(/[^0-9.-]+/g, ""));
    if (!numAmount || numAmount <= 0) {
      setErrorMessage("Please enter a valid amount greater than 0");
      return;
    }

    if (!accountId) {
      setErrorMessage("Please select an account for this transaction");
      return;
    }

    if (!description.trim()) {
      setErrorMessage("Please enter a description");
      return;
    }

    if (
      type === "EXPENSE" &&
      adjustBalance &&
      selectedVault &&
      !isEditing &&
      selectedVault.balance < numAmount
    ) {
      setErrorMessage(
        `Insufficient balance in ${selectedVault.name}. Current balance is ${new Intl.NumberFormat(
          "id-ID",
          {
            style: "currency",
            currency: selectedVault.currency || "IDR",
            maximumFractionDigits: 0,
          }
        ).format(selectedVault.balance)}.`
      );
      return;
    }

    setIsLoading(true);
    try {
      const targetDate = date ? new Date(date + "T12:00:00").toISOString() : new Date().toISOString();

      if (isEditing && transactionToEdit) {
        const res = await api.updateTransaction(transactionToEdit.id, {
          accountId,
          amount: type === "EXPENSE" ? -Math.abs(numAmount) : Math.abs(numAmount),
          type,
          date: targetDate,
          description: description.trim(),
          category,
          labels,
          notes: notes.trim() || undefined,
          adjustBalance,
        });
        onSuccess(res.transaction);
      } else {
        const res = await api.createTransaction({
          accountId,
          amount: type === "EXPENSE" ? -Math.abs(numAmount) : Math.abs(numAmount),
          type,
          date: targetDate,
          description: description.trim(),
          category,
          labels,
          notes: notes.trim() || undefined,
          adjustBalance,
        });
        onSuccess(res.transaction);
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save transaction";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="gap-1.5">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            {isEditing ? (
              <>
                <PencilIcon className="size-4 text-primary" />
                Edit Transaction
              </>
            ) : defaultBudget ? (
              <>
                <PiggyBankIcon className="size-4 text-primary" />
                New Budget Expense
              </>
            ) : isExpenseOnly ? (
              <>
                <PlusIcon className="size-4 text-primary" />
                New Expense
              </>
            ) : (
              <>
                <PlusIcon className="size-4 text-primary" />
                New Transaction
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditing
              ? "Modify details for this movement."
              : defaultBudget
              ? `Record an expense movement allocated to ${defaultBudget.name}.`
              : isExpenseOnly
              ? "Record an expense movement into your vault."
              : "Record an income or expense movement into your vault."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          {errorMessage && (
            <Alert variant="destructive" className="py-2.5">
              <AlertCircleIcon className="size-4 shrink-0" />
              <AlertTitle className="text-xs font-semibold">Error</AlertTitle>
              <AlertDescription className="text-[11px] text-destructive/90">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Type Switcher: Expense vs Income */}
          {isExpenseOnly ? (
            <div className="flex items-center justify-center gap-1.5 h-8.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold select-none">
              <ArrowDownRightIcon className="size-3.5" />
              <span>Expense (-)</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={type === "EXPENSE" ? "secondary" : "outline"}
                onClick={() => {
                  setType("EXPENSE");
                  setCategory((prev) =>
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
                className={`flex items-center justify-center gap-1.5 h-9 text-xs font-semibold cursor-pointer ${
                  type === "EXPENSE"
                    ? "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                    : "border-border bg-card/50 text-muted-foreground hover:bg-accent/40"
                }`}
              >
                <ArrowDownRightIcon className="size-3.5" />
                Expense (-)
              </Button>
              <Button
                type="button"
                variant={type === "INCOME" ? "secondary" : "outline"}
                onClick={() => {
                  setType("INCOME");
                  setCategory((prev) =>
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
                className={`flex items-center justify-center gap-1.5 h-9 text-xs font-semibold cursor-pointer ${
                  type === "INCOME"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                    : "border-border bg-card/50 text-muted-foreground hover:bg-accent/40"
                }`}
              >
                <ArrowUpRightIcon className="size-3.5" />
                Income (+)
              </Button>
            </div>
          )}

          {/* Account Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Account / Vault
            </Label>
            <Select value={accountId} onValueChange={(val) => val && setAccountId(val)}>
              <SelectTrigger className="w-full h-8 text-xs bg-muted/40 border-border/70 cursor-pointer">
                <SelectValue placeholder="Select account">
                  {selectedVault ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="flex size-3.5 items-center justify-center rounded text-white shrink-0"
                        style={{ backgroundColor: selectedVault.color || "#3B82F6" }}
                      >
                        {getProviderIcon(selectedVault.providerType)}
                      </span>
                      <span className="font-medium truncate">{selectedVault.name}</span>
                    </div>
                  ) : (
                    "Select account"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {vaults.map((vault) => (
                  <SelectItem key={vault.id} value={vault.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex size-3.5 items-center justify-center rounded text-white shrink-0"
                        style={{ backgroundColor: vault.color || "#3B82F6" }}
                      >
                        {getProviderIcon(vault.providerType)}
                      </span>
                      <span className="font-medium truncate">{vault.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: vault.currency || "IDR",
                          maximumFractionDigits: 0,
                        }).format(vault.balance)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount (Full Width) */}
          <div className="space-y-1.5">
            <Label htmlFor="tx-amount" className="text-xs font-semibold text-foreground">
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                Rp
              </span>
              <Input
                id="tx-amount"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-xs h-8 bg-muted/40 border-border/70 font-mono"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Date (Full Width with Calendar Icon) */}
          <div className="space-y-1.5">
            <Label htmlFor="tx-date" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CalendarIcon className="size-3.5 text-muted-foreground" />
              Date
            </Label>
            <Input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs h-8 bg-muted/40 border-border/70 [color-scheme:dark]"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                Category
              </Label>
              {Boolean(defaultBudget) && (
                <span className="text-[10px] text-muted-foreground italic">
                  Locked to budget
                </span>
              )}
            </div>
            <CategorySelect
              value={category}
              onChange={handleCategoryChange}
              typeFilter={type}
              disabled={Boolean(defaultBudget)}
              className="bg-muted/40 border-border/70 h-8"
            />

            {/* Matched Budget Context Banner - automatically matches active budget for expense */}
            {type === "EXPENSE" && matchedBudget && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 text-xs flex items-center justify-between mt-1.5 animate-in fade-in-50">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="flex size-6 items-center justify-center rounded-md text-white text-xs shrink-0 shadow-2xs"
                    style={{ backgroundColor: matchedBudget.color || "#10B981" }}
                  >
                    <PiggyBankIcon className="size-3" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate text-xs leading-tight">
                      {matchedBudget.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      {matchedBudget.remaining >= 0
                        ? `Remaining: ${new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0,
                          }).format(matchedBudget.remaining)}`
                        : `Over budget by ${new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0,
                          }).format(Math.abs(matchedBudget.remaining))}`}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    matchedBudget.percentage >= 100
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : matchedBudget.percentage >= 75
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {matchedBudget.percentage}% used
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="tx-description" className="text-xs font-semibold text-foreground">
              Description
            </Label>
            <Input
              id="tx-description"
              type="text"
              placeholder={
                type === "EXPENSE"
                  ? "e.g. Grocery shopping, Electricity bill"
                  : "e.g. Monthly salary, Freelance payment"
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs h-8 bg-muted/40 border-border/70"
              maxLength={200}
              required
            />
          </div>

          {/* Labels Combobox */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Labels (Optional)
            </Label>
            <LabelCombobox
              selectedLabels={labels}
              onChange={setLabels}
              placeholder="Search or add labels..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="tx-notes" className="text-xs font-semibold text-foreground">
              Notes (Optional)
            </Label>
            <Input
              id="tx-notes"
              type="text"
              placeholder="Additional memo or reference notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs h-8 bg-muted/40 border-border/70"
              maxLength={500}
            />
          </div>

          <DialogFooter className="gap-2 pt-3 sm:justify-end">
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
              disabled={isLoading}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              {isLoading && <Loader2Icon className="size-3.5 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
