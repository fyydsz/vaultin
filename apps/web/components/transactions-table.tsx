"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Transaction, BankVault, api } from "@/lib/api";
import { useLabelStore } from "@/stores/label-store";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCategoryIcon } from "@/components/category-select";
import {
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  ArrowDownIcon,
  ArrowUpIcon,
  ReceiptTextIcon,
  Loader2Icon,
  Building2Icon,
  WalletIcon,
  BanknoteIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

interface TransactionsTableProps {
  transactions: Transaction[];
  vaults?: BankVault[];
  isLoading?: boolean;
  onTransactionUpdated?: () => void;
  onTransactionDeleted?: () => void;
  onEditTransaction?: (tx: Transaction) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  sortOrder?: "desc" | "asc";
  onToggleSort?: () => void;
  className?: string;
}

const CATEGORY_NAMES: Record<string, { name: string; color: string; icon: string }> = {
  food_beverage: { name: "Food & Beverage", color: "#F97316", icon: "Utensils" },
  transportation: { name: "Transportation", color: "#3B82F6", icon: "Car" },
  shopping: { name: "Shopping & Groceries", color: "#EC4899", icon: "ShoppingBag" },
  housing_utilities: { name: "Housing & Utilities", color: "#6366F1", icon: "Home" },
  health: { name: "Health & Medical", color: "#EF4444", icon: "HeartPulse" },
  beauty: { name: "Personal Care & Beauty", color: "#D946EF", icon: "Sparkles" },
  education: { name: "Education & Learning", color: "#10B981", icon: "GraduationCap" },
  entertainment: { name: "Entertainment & Recreation", color: "#8B5CF6", icon: "Gamepad2" },
  gift_donation: { name: "Gifts & Donations", color: "#14B8A6", icon: "Gift" },
  salary_income: { name: "Salary & Income", color: "#22C55E", icon: "Wallet" },
  side_income: { name: "Freelance & Business", color: "#06B6D4", icon: "Briefcase" },
  savings_investment: { name: "Savings & Investments", color: "#84CC16", icon: "TrendingUp" },
  other_expense: { name: "Other Expense", color: "#64748B", icon: "MoreHorizontal" },
  other_income: { name: "Other Income", color: "#0EA5E9", icon: "PlusCircle" },
};

export function TransactionsTable({
  transactions = [],
  vaults = [],
  isLoading = false,
  onTransactionUpdated,
  onTransactionDeleted,
  onEditTransaction,
  onClearFilters,
  hasActiveFilters = false,
  sortOrder = "desc",
  onToggleSort,
  className = "",
}: TransactionsTableProps) {
  const { labels, fetchLabels } = useLabelStore();

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const labelColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of labels) {
      if (item.name) {
        map.set(item.name.toLowerCase(), item.color || "#64748B");
      }
    }
    return map;
  }, [labels]);

  const vaultMap = useMemo(() => {
    const map = new Map<string, BankVault>();
    for (const v of vaults) {
      map.set(v.id, v);
    }
    return map;
  }, [vaults]);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Delete transaction dialog state
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

  const formatCurrency = (val: number, currency: string = "IDR") => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency || "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getProviderIcon = (providerType?: string) => {
    switch (providerType) {
      case "BANK":
        return <Building2Icon className="size-3" />;
      case "E_WALLET":
        return <WalletIcon className="size-3" />;
      case "CASH":
        return <BanknoteIcon className="size-3" />;
      default:
        return <WalletIcon className="size-3" />;
    }
  };

  const allSelected =
    transactions.length > 0 &&
    transactions.every((tx) => selectedIds.includes(tx.id));

  const someSelected =
    selectedIds.length > 0 && selectedIds.length < transactions.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map((tx) => tx.id));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirmDeleteSingle = async () => {
    if (!txToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteTransaction(txToDelete.id, true);
      setSelectedIds((prev) => prev.filter((id) => id !== txToDelete.id));
      setTxToDelete(null);
      onTransactionDeleted?.();
    } catch (err: unknown) {
      console.error("Failed to delete transaction:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      for (const id of selectedIds) {
        await api.deleteTransaction(id, true);
      }
      setSelectedIds([]);
      setIsBulkConfirmOpen(false);
      onTransactionDeleted?.();
    } catch (err: unknown) {
      console.error("Failed to bulk delete transactions:", err);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Bulk Action Header when rows are selected */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 px-3.5 py-2 text-xs animate-in fade-in-0 duration-100">
          <div className="font-semibold text-primary">
            {selectedIds.length} transaction{selectedIds.length > 1 ? "s" : ""} selected
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setSelectedIds([])}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Deselect All
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="xs"
              onClick={() => setIsBulkConfirmOpen(true)}
              className="gap-1 text-xs cursor-pointer"
            >
              <Trash2Icon className="size-3" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-border/80 bg-card/60 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                {/* Select All Checkbox */}
                <th className="w-10 px-3.5 py-2.5">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all transactions"
                  />
                </th>

                {/* Date Column */}
                <th className="w-28 px-3 py-2.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={onToggleSort}
                    className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <span>Date</span>
                    {sortOrder === "desc" ? (
                      <ArrowDownIcon className="size-3 text-muted-foreground" />
                    ) : (
                      <ArrowUpIcon className="size-3 text-muted-foreground" />
                    )}
                  </button>
                </th>

                {/* Account Column */}
                <th className="w-36 px-3 py-2.5 whitespace-nowrap">Account</th>

                {/* Category Column */}
                <th className="w-40 px-3 py-2.5 whitespace-nowrap">Category</th>

                {/* Description Column */}
                <th className="px-3 py-2.5 text-left">Description</th>

                {/* Labels Column */}
                <th className="w-36 px-3 py-2.5 text-left">Labels</th>

                {/* Amount Column */}
                <th className="w-32 px-3 py-2.5 text-right whitespace-nowrap">Amount</th>

                {/* Actions Column */}
                <th className="w-10 px-2 py-2.5 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {transactions.length > 0 ? (
                transactions.map((tx) => {
                  const isSelected = selectedIds.includes(tx.id);
                  const isIncome = tx.amount > 0 || tx.type === "INCOME";
                  const formatCatSlug = (s?: string) => {
                    if (!s) return "General";
                    return s
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase());
                  };
                  const catMeta = CATEGORY_NAMES[tx.category] || {
                    name: formatCatSlug(tx.category),
                    color: "#64748B",
                    icon: "Tag",
                  };
                  const CatIcon = getCategoryIcon(catMeta.icon);

                  const linkedVault = vaultMap.get(tx.accountId) || tx.account;
                  const vaultName = linkedVault?.name || "Vault";
                  const vaultColor = linkedVault?.color || "#3B82F6";
                  const vaultProviderType = linkedVault?.providerType;

                  return (
                    <tr
                      key={tx.id}
                      className={`group transition-colors hover:bg-muted/30 ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3.5 py-2.5 align-middle">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleRow(tx.id)}
                          aria-label={`Select transaction ${tx.description}`}
                        />
                      </td>

                      {/* Date */}
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground font-medium align-middle">
                        {formatDate(tx.date)}
                      </td>

                      {/* Account */}
                      <td className="px-3 py-2.5 whitespace-nowrap align-middle">
                        <div className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 bg-muted/40 border border-border/50 text-foreground font-medium text-[11px]">
                          <span
                            className="flex size-3.5 items-center justify-center rounded text-white shrink-0"
                            style={{ backgroundColor: vaultColor }}
                          >
                            {getProviderIcon(vaultProviderType)}
                          </span>
                          <span className="truncate max-w-[100px]">{vaultName}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-2.5 whitespace-nowrap align-middle">
                        <div className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 bg-muted/60 border border-border/50 text-foreground font-medium text-[11px]">
                          <span
                            className="flex size-4 items-center justify-center rounded text-white shrink-0"
                            style={{ backgroundColor: catMeta.color }}
                          >
                            <CatIcon className="size-2.5" />
                          </span>
                          <span className="capitalize truncate max-w-[120px]">
                            {catMeta.name}
                          </span>
                        </div>
                      </td>

                      {/* Description & Notes */}
                      <td className="px-3 py-2.5 align-middle">
                        <div className="space-y-0.5">
                          <span className="font-medium text-foreground truncate max-w-sm block">
                            {tx.description ? (
                              tx.description
                            ) : (
                              <span className="text-muted-foreground italic">—</span>
                            )}
                          </span>
                          {tx.notes && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-sm block">
                              {tx.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Labels */}
                      <td className="px-3 py-2.5 align-middle">
                        {tx.labels && tx.labels.length > 0 ? (
                          <div className="flex flex-wrap gap-1 items-center">
                            {tx.labels.map((lbl) => {
                              const color =
                                labelColorMap.get(lbl.toLowerCase()) || "#64748B";
                              return (
                                <span
                                  key={lbl}
                                  className="inline-flex items-center gap-1.5 rounded-md bg-secondary text-secondary-foreground border border-border/80 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap"
                                >
                                  <span
                                    className="size-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span>#{lbl}</span>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-2.5 text-right whitespace-nowrap align-middle">
                        <span
                          className={`font-mono font-bold text-xs ${
                            isIncome
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatCurrency(Math.abs(tx.amount))}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-2 py-2.5 text-center align-middle">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="size-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                <MoreHorizontalIcon className="size-3.5" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-36 text-xs">
                            <DropdownMenuItem
                              onClick={() => onEditTransaction?.(tx)}
                              className="cursor-pointer gap-2"
                            >
                              <PencilIcon className="size-3.5 text-muted-foreground" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setTxToDelete(tx)}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-2"
                            >
                              <Trash2Icon className="size-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <ReceiptTextIcon className="size-9 mx-auto mb-2.5 opacity-35" />
                    <p className="font-semibold text-foreground text-sm">
                      {hasActiveFilters
                        ? "No matching transactions found"
                        : "No transactions recorded yet"}
                    </p>
                    <p className="text-xs text-muted-foreground/80 mt-1 max-w-sm mx-auto">
                      {hasActiveFilters
                        ? "Try adjusting your filters or search keywords to find what you are looking for."
                        : "Create your first transaction movement to start tracking your cashflow."}
                    </p>
                    {hasActiveFilters && onClearFilters && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={onClearFilters}
                        className="mt-3.5 text-xs font-semibold cursor-pointer"
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="border-t border-border/60 bg-muted/20 px-3.5 py-2 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>
            {transactions.length} transaction
            {transactions.length === 1 ? "" : "s"}
          </span>
          {selectedIds.length > 0 && (
            <span className="font-medium text-foreground">
              {selectedIds.length} of {transactions.length} selected
            </span>
          )}
        </div>
      </div>

      {/* Delete Single Transaction Confirmation Dialog */}
      <Dialog
        open={!!txToDelete}
        onOpenChange={(open) => !open && setTxToDelete(null)}
      >
        <DialogContent className="max-w-sm p-5">
          <DialogHeader className="gap-1.5">
            <DialogTitle className="text-sm font-bold text-foreground">
              Delete Transaction?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete &quot;
              <span className="font-semibold text-foreground">
                {txToDelete?.description || "Transaction"}
              </span>
              &quot; ({txToDelete ? formatCurrency(Math.abs(txToDelete.amount)) : ""})?
              This will automatically reverse the balance adjustment on the linked account.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTxToDelete(null)}
              disabled={isDeleting}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDeleteSingle}
              disabled={isDeleting}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              {isDeleting && <Loader2Icon className="size-3 animate-spin" />}
              Delete Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={isBulkConfirmOpen}
        onOpenChange={(open) => !open && setIsBulkConfirmOpen(false)}
      >
        <DialogContent className="max-w-sm p-5">
          <DialogHeader className="gap-1.5">
            <DialogTitle className="text-sm font-bold text-foreground">
              Delete {selectedIds.length} Transactions?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete these {selectedIds.length} selected transactions?
              Their balance adjustments will be reverted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBulkConfirmOpen(false)}
              disabled={isBulkDeleting}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmBulkDelete}
              disabled={isBulkDeleting}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              {isBulkDeleting && <Loader2Icon className="size-3 animate-spin" />}
              Delete Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
