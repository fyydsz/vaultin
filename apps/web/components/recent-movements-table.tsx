"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Transaction, api } from "@/lib/api";
import { useLabelStore } from "@/stores/label-store";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CategorySelect, getCategoryIcon } from "@/components/category-select";
import { LabelCombobox } from "@/components/label-combobox";
import {
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  ArrowDownIcon,
  ArrowUpIcon,
  ReceiptTextIcon,
  Loader2Icon,
} from "lucide-react";

interface RecentMovementsTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
  currency?: string;
  accountName?: string;
  onTransactionDeleted?: () => void;
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

export function RecentMovementsTable({
  transactions = [],
  isLoading = false,
  currency = "IDR",
  onTransactionDeleted,
  className = "",
}: RecentMovementsTableProps) {
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

  // Sort state: date descending by default
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Delete transaction dialog state
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

  // Edit transaction state
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("food_beverage");
  const [editLabels, setEditLabels] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState("");

  const formatCurrency = (val: number) => {
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

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [transactions, sortOrder]);

  const allSelected =
    sortedTransactions.length > 0 &&
    sortedTransactions.every((tx) => selectedIds.includes(tx.id));

  const someSelected =
    selectedIds.length > 0 && selectedIds.length < sortedTransactions.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedTransactions.map((tx) => tx.id));
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

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txToEdit) return;

    setIsUpdating(true);
    setEditError("");
    try {
      await api.updateTransaction(txToEdit.id, {
        description: editDescription.trim() || undefined,
        category: editCategory,
        labels: editLabels,
      });
      setTxToEdit(null);
      onTransactionDeleted?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update transaction";
      setEditError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full rounded-lg" />
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
          <table className="w-full text-left text-xs border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                <th className="w-10 px-3.5 py-2.5">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all transactions"
                  />
                </th>
                <th className="w-28 px-3 py-2.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
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
                <th className="w-44 px-3 py-2.5 whitespace-nowrap">Category</th>
                <th className="px-3 py-2.5 text-left">Description</th>
                <th className="px-3 py-2.5 text-left"></th>
                <th className="w-36 px-3 py-2.5 text-right whitespace-nowrap">Amount</th>
                <th className="w-10 px-2 py-2.5 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {sortedTransactions.length > 0 ? (
                sortedTransactions.map((tx) => {
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

                  return (
                    <tr
                      key={tx.id}
                      className={`group transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""
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

                      {/* Category */}
                      <td className="px-3 py-2.5 whitespace-nowrap align-middle">
                        <div className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 bg-muted/60 border border-border/50 text-foreground font-medium text-[11px]">
                          <span
                            className="flex size-4 items-center justify-center rounded text-white shrink-0"
                            style={{ backgroundColor: catMeta.color }}
                          >
                            <CatIcon className="size-2.5" />
                          </span>
                          <span className="capitalize truncate max-w-[130px]">
                            {catMeta.name}
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-3 py-2.5 font-medium text-foreground align-middle">
                        <span className="truncate max-w-sm block">
                          {tx.description ? (
                            tx.description
                          ) : (
                            <span className="text-muted-foreground italic">—</span>
                          )}
                        </span>
                      </td>

                      {/* Labels */}
                      <td className="px-3 py-2.5 align-middle">
                        {tx.labels && tx.labels.length > 0 ? (
                          <div className="flex flex-wrap gap-1 items-center">
                            {tx.labels.map((lbl) => {
                              const color = labelColorMap.get(lbl.toLowerCase()) || "#64748B";
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
                        ) : null}
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-2.5 text-right whitespace-nowrap align-middle">
                        <span
                          className={`font-mono font-bold text-xs ${isIncome
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
                              onClick={() => {
                                setTxToEdit(tx);
                                setEditDescription(tx.description || "");
                                setEditCategory(
                                  tx.category || (isIncome ? "salary_income" : "food_beverage")
                                );
                                setEditLabels(tx.labels || []);
                                setEditError("");
                              }}
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
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    <ReceiptTextIcon className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">No transactions loaded</p>
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                      New income and expense adjustments will appear here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="border-t border-border/60 bg-muted/20 px-3.5 py-2 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>
            {sortedTransactions.length} transaction
            {sortedTransactions.length === 1 ? "" : "s"} loaded
          </span>
          {selectedIds.length > 0 && (
            <span className="font-medium text-foreground">
              {selectedIds.length} of {sortedTransactions.length} selected
            </span>
          )}
        </div>
      </div>

      {/* Edit Transaction Modal Dialog */}
      <Dialog
        open={!!txToEdit}
        onOpenChange={(open) => !open && setTxToEdit(null)}
      >
        <DialogContent className="max-w-sm p-5">
          <DialogHeader className="gap-1.5">
            <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <PencilIcon className="size-4 text-primary" />
              Edit Movement
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update category, labels, or description for this movement.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-3 pt-1">
            {editError && (
              <div className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                {editError}
              </div>
            )}

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category</Label>
              <CategorySelect
                value={editCategory}
                onChange={setEditCategory}
                typeFilter="ALL"
                disabled={isUpdating}
              />
            </div>

            {/* Description Input */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-tx-desc" className="text-xs font-semibold">
                Description
              </Label>
              <Input
                id="edit-tx-desc"
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="e.g. Salary, Food, etc."
                className="text-xs"
                maxLength={200}
                disabled={isUpdating}
              />
            </div>

            {/* Labels Combobox */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Labels (Optional)</Label>
              <LabelCombobox
                selectedLabels={editLabels}
                onChange={setEditLabels}
                placeholder="Search or create labels"
                disabled={isUpdating}
              />
            </div>

            <DialogFooter className="gap-2 pt-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTxToEdit(null)}
                disabled={isUpdating}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isUpdating}
                className="gap-1.5 text-xs font-semibold"
              >
                {isUpdating && <Loader2Icon className="size-3 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
              Are you sure you want to delete the transaction &quot;
              <span className="font-semibold text-foreground">
                {txToDelete?.description || "Transaction"}
              </span>
              &quot; ({txToDelete ? formatCurrency(Math.abs(txToDelete.amount)) : ""})?
              This will reverse the balance adjustment on this account.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTxToDelete(null)}
              disabled={isDeleting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDeleteSingle}
              disabled={isDeleting}
              className="gap-1.5 text-xs font-semibold"
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
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmBulkDelete}
              disabled={isBulkDeleting}
              className="gap-1.5 text-xs font-semibold"
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
