"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BankVault, CategoryItem, LabelItem } from "@/lib/api";
import { useCategoryStore } from "@/stores/category-store";
import { useLabelStore } from "@/stores/label-store";
import { getCategoryIcon } from "@/components/category-select";
import {
  FilterMultiSelect,
  type FilterOption,
} from "@/components/filter-multi-select";
import {
  FilterIcon,
  RotateCcwIcon,
  Building2Icon,
  WalletIcon,
  BanknoteIcon,
} from "lucide-react";

export interface TransactionFilters {
  search: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  categories: string[];
  labels: string[];
  accountIds: string[];
}

interface TransactionFilterPopoverProps {
  filters: TransactionFilters;
  onFilterChange: (filters: Partial<TransactionFilters>) => void;
  onReset: () => void;
  vaults: BankVault[];
  activeFilterCount: number;
}

export function TransactionFilterPopover({
  filters,
  onFilterChange,
  onReset,
  vaults = [],
  activeFilterCount = 0,
}: TransactionFilterPopoverProps) {
  const [open, setOpen] = useState(false);

  const { categories, fetchCategories } = useCategoryStore();
  const { labels, fetchLabels } = useLabelStore();

  useEffect(() => {
    fetchCategories();
    fetchLabels();
  }, [fetchCategories, fetchLabels]);

  const getProviderIcon = (type?: string) => {
    switch (type) {
      case "BANK":
        return <Building2Icon className="size-2.5" />;
      case "E_WALLET":
        return <WalletIcon className="size-2.5" />;
      case "CASH":
        return <BanknoteIcon className="size-2.5" />;
      default:
        return <WalletIcon className="size-2.5" />;
    }
  };

  // Convert categories to FilterOptions with icons and formatted names
  const categoryOptions: FilterOption[] = useMemo(() => {
    return categories.map((cat) => {
      const CatIcon = getCategoryIcon(cat.icon);
      return {
        id: cat.slug || cat.id,
        name: cat.name,
        icon: (
          <span
            className="flex size-4 items-center justify-center rounded-full text-white shrink-0"
            style={{ backgroundColor: cat.color || "#F97316" }}
          >
            <CatIcon className="size-2.5" />
          </span>
        ),
      };
    });
  }, [categories]);

  // Convert labels to FilterOptions
  const labelOptions: FilterOption[] = useMemo(() => {
    return labels.map((lbl) => ({
      id: lbl.name,
      name: `#${lbl.name}`,
      icon: (
        <span
          className="size-2 rounded-full shrink-0"
          style={{ backgroundColor: lbl.color || "#64748B" }}
        />
      ),
    }));
  }, [labels]);

  // Convert vaults to FilterOptions
  const accountOptions: FilterOption[] = useMemo(() => {
    return vaults.map((vault) => ({
      id: vault.id,
      name: vault.name,
      subtitle: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: vault.currency || "IDR",
        maximumFractionDigits: 0,
      }).format(vault.balance),
      icon: (
        <span
          className="flex size-4 items-center justify-center rounded-md text-white shrink-0"
          style={{ backgroundColor: vault.color || "#3B82F6" }}
        >
          {getProviderIcon(vault.providerType)}
        </span>
      ),
    }));
  }, [vaults]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 text-xs font-semibold h-9 px-3.5 border-border/80 cursor-pointer transition-all ${
              activeFilterCount > 0
                ? "bg-primary/10 border-primary/40 text-primary hover:bg-primary/20"
                : "hover:bg-muted/60"
            }`}
          >
            <FilterIcon className="size-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        }
      />

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[320px] max-w-[92vw] max-h-[85vh] overflow-y-auto p-4 space-y-4 rounded-xl border border-border/80 bg-card text-foreground shadow-2xl backdrop-blur-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
            <FilterIcon className="size-4 text-primary" />
            <span>Filters</span>
          </div>

          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onReset}
              className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RotateCcwIcon className="size-3" />
              Reset
            </Button>
          )}
        </div>

        {/* Date Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Date</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => onFilterChange({ startDate: e.target.value })}
                className="h-8.5 text-xs px-2.5 bg-muted/40 border-border/70 [color-scheme:dark]"
                placeholder="dd/mm/yyyy"
                aria-label="Start Date"
              />
            </div>
            <div className="relative">
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => onFilterChange({ endDate: e.target.value })}
                className="h-8.5 text-xs px-2.5 bg-muted/40 border-border/70 [color-scheme:dark]"
                placeholder="dd/mm/yyyy"
                aria-label="End Date"
              />
            </div>
          </div>
        </div>

        {/* Amount Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Amount</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              min="0"
              placeholder="Min"
              value={filters.minAmount}
              onChange={(e) => onFilterChange({ minAmount: e.target.value })}
              className="h-8.5 text-xs px-3 bg-muted/40 border-border/70"
            />
            <Input
              type="number"
              min="0"
              placeholder="Max"
              value={filters.maxAmount}
              onChange={(e) => onFilterChange({ maxAmount: e.target.value })}
              className="h-8.5 text-xs px-3 bg-muted/40 border-border/70"
            />
          </div>
        </div>

        {/* Categories Multi-Select Filter with Search & Checkboxes */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Categories</Label>
          <FilterMultiSelect
            placeholder="Select categories..."
            searchPlaceholder="Search categories..."
            options={categoryOptions}
            selectedIds={filters.categories}
            onChange={(selectedIds) => onFilterChange({ categories: selectedIds })}
          />
        </div>

        {/* Labels Multi-Select Filter with Search & Checkboxes */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Labels</Label>
          <FilterMultiSelect
            placeholder="Select labels..."
            searchPlaceholder="Search labels..."
            options={labelOptions}
            selectedIds={filters.labels}
            onChange={(selectedIds) => onFilterChange({ labels: selectedIds })}
          />
        </div>

        {/* Accounts Multi-Select Filter with Search & Checkboxes */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Accounts</Label>
          <FilterMultiSelect
            placeholder="Select accounts..."
            searchPlaceholder="Search accounts..."
            options={accountOptions}
            selectedIds={filters.accountIds}
            onChange={(selectedIds) => onFilterChange({ accountIds: selectedIds })}
          />
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={onReset}
            disabled={activeFilterCount === 0}
            className="text-xs cursor-pointer"
          >
            Reset
          </Button>
          <Button
            type="button"
            size="xs"
            onClick={() => setOpen(false)}
            className="text-xs font-semibold cursor-pointer"
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
