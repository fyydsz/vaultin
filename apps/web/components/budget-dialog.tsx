"use client";

import React, { useState } from "react";
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
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
  api,
} from "@/lib/api";
import {
  CheckIcon,
  Loader2Icon,
  AlertCircleIcon,
  RotateCcwIcon,
  SparklesIcon,
  CalendarIcon,
  CalendarDaysIcon,
  ClockIcon,
  SunMediumIcon,
} from "lucide-react";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { CategorySelect } from "@/components/category-select";
import { LabelCombobox } from "@/components/label-combobox";
import { useCategoryStore } from "@/stores/category-store";

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetToEdit?: Budget | null;
  onSuccess: (budget: Budget) => void;
}

const PRESET_COLORS = [
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#64748B", // Slate
];

const PERIOD_OPTIONS = [
  { value: "DAILY", label: "Daily", icon: SunMediumIcon, desc: "Resets every day at midnight" },
  { value: "WEEKLY", label: "Weekly", icon: ClockIcon, desc: "Resets every week (Mon - Sun)" },
  { value: "MONTHLY", label: "Monthly", icon: CalendarDaysIcon, desc: "Resets every 1st of the month" },
  { value: "CUSTOM", label: "Custom Range", icon: CalendarIcon, desc: "Specific start and end dates" },
];

interface BudgetFormProps {
  budgetToEdit?: Budget | null;
  onSuccess: (budget: Budget) => void;
  onClose: () => void;
}

function BudgetForm({ budgetToEdit, onSuccess, onClose }: BudgetFormProps) {
  const { categories } = useCategoryStore();
  const isEditing = !!budgetToEdit;

  const [categorySlug, setCategorySlug] = useState(
    budgetToEdit?.categorySlug || ""
  );
  const [labels, setLabels] = useState<string[]>(
    budgetToEdit?.labels || []
  );
  const [name, setName] = useState(budgetToEdit?.name || "");
  const [amount, setAmount] = useState<string>(
    budgetToEdit?.baseAmount?.toString() ||
      budgetToEdit?.amount?.toString() ||
      ""
  );
  const [period, setPeriod] = useState<string>(
    budgetToEdit?.period || "MONTHLY"
  );
  const [startDate, setStartDate] = useState<string>(
    budgetToEdit?.startDate
      ? new Date(budgetToEdit.startDate).toISOString().slice(0, 10)
      : ""
  );
  const [endDate, setEndDate] = useState<string>(
    budgetToEdit?.endDate
      ? new Date(budgetToEdit.endDate).toISOString().slice(0, 10)
      : ""
  );
  const [rolloverType, setRolloverType] = useState<"RESET" | "CARRY_OVER">(
    (budgetToEdit?.rolloverType as "RESET" | "CARRY_OVER") || "RESET"
  );
  const [color, setColor] = useState(budgetToEdit?.color || "#10B981");
  const [icon, setIcon] = useState(budgetToEdit?.icon || "Tag");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // When category changes in create mode, auto-fill name, color, and icon if available
  const handleCategoryChange = (slug: string) => {
    setCategorySlug(slug);
    const selectedCat = categories.find((c) => c.slug === slug || c.id === slug);
    if (selectedCat) {
      if (!isEditing && (!name || categories.some((c) => c.name === name))) {
        setName(selectedCat.name);
      }
      if (!isEditing && selectedCat.color) {
        setColor(selectedCat.color);
      }
      if (selectedCat.icon) {
        setIcon(selectedCat.icon);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!categorySlug) {
      setErrorMessage("Please select an expense category");
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Budget name is required");
      return;
    }

    if (trimmedName.length > 100) {
      setErrorMessage("Budget name cannot exceed 100 characters");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage("Budget limit amount must be greater than 0");
      return;
    }

    if (period === "CUSTOM") {
      if (!startDate || !endDate) {
        setErrorMessage("Please specify both start date and end date for custom period");
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        setErrorMessage("Start date cannot be after end date");
        return;
      }
    }

    try {
      setIsLoading(true);
      if (isEditing && budgetToEdit) {
        const updateData: UpdateBudgetInput = {
          name: trimmedName,
          categorySlug,
          labels,
          amount: numAmount,
          period,
          startDate: period === "CUSTOM" ? startDate : undefined,
          endDate: period === "CUSTOM" ? endDate : undefined,
          rolloverType,
          color,
          icon,
        };
        const res = await api.updateBudget(budgetToEdit.id, updateData);
        onSuccess(res.budget);
      } else {
        const createData: CreateBudgetInput = {
          name: trimmedName,
          categorySlug,
          labels,
          amount: numAmount,
          period,
          startDate: period === "CUSTOM" ? startDate : undefined,
          endDate: period === "CUSTOM" ? endDate : undefined,
          rolloverType,
          color,
          icon,
        };
        const res = await api.createBudget(createData);
        onSuccess(res.budget);
      }
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save budget";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetTitle =
    period === "DAILY"
      ? "Daily Reset"
      : period === "WEEKLY"
      ? "Weekly Reset"
      : "Monthly Reset";

  const resetSubtitle =
    period === "DAILY"
      ? "Budget limit resets to fresh start every midnight."
      : period === "WEEKLY"
      ? "Budget limit resets to fresh start every Monday."
      : "Budget limit resets to fresh start every 1st of the month.";

  const carryOverSubtitle =
    period === "DAILY"
      ? "Unspent positive balance adds to tomorrow's budget."
      : period === "WEEKLY"
      ? "Unspent positive balance adds to next week's budget."
      : "Unspent positive balance adds to next month's budget.";

  return (
    <>
      <DialogHeader className="gap-1.5">
        <DialogTitle className="text-lg font-bold">
          {isEditing ? "Edit Budget" : "Add New Budget"}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Update budget limit, category, and rollover settings."
            : "Set a spending limit, category, and cycle for your budget."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {errorMessage && (
          <Alert variant="destructive" className="animate-in fade-in-50">
            <AlertCircleIcon className="size-4 shrink-0" />
            <AlertTitle className="font-semibold">Something went wrong</AlertTitle>
            <AlertDescription className="text-xs text-destructive/90">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Budget Name */}
        <div className="space-y-1.5">
          <Label htmlFor="budget-name" className="text-xs font-semibold">
            Budget Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="budget-name"
            placeholder="e.g. Food & Dining Monthly, Coffee Budget"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            disabled={isLoading}
          />
        </div>

        {/* Category Selection */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">
            Expense Category <span className="text-destructive">*</span>
          </Label>
          <CategorySelect
            value={categorySlug}
            onChange={handleCategoryChange}
            typeFilter="EXPENSE"
            disabled={isLoading || isEditing}
            placeholder="Select expense category..."
          />
          {isEditing && (
            <p className="text-[11px] text-muted-foreground">
              Category cannot be changed once created. Create a new budget for a different category.
            </p>
          )}
        </div>

        {/* Labels Filter */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Labels</Label>
          <LabelCombobox
            selectedLabels={labels}
            onChange={setLabels}
            placeholder="Select labels"
            disabled={isLoading}
          />
          <p className="text-[11px] text-muted-foreground">
            Select at least one category or label to track.
          </p>
        </div>

        {/* Limit Amount */}
        <div className="space-y-1.5">
          <Label htmlFor="budget-amount" className="text-xs font-semibold">
            Limit Amount <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
              Rp
            </span>
            <Input
              id="budget-amount"
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 3000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-9 font-mono"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Budget Period Dropdown */}
        <div className="space-y-1.5">
          <Label htmlFor="budget-period" className="text-xs font-semibold">
            Budget Period
          </Label>
          <Select
            value={period}
            onValueChange={(val) => val && setPeriod(val)}
            disabled={isLoading}
          >
            <SelectTrigger id="budget-period" className="w-full bg-card text-xs cursor-pointer">
              <SelectValue placeholder="Select budget period">
                {(() => {
                  const sel = PERIOD_OPTIONS.find((p) => p.value === period);
                  if (!sel) return "Monthly";
                  const SelIcon = sel.icon;
                  return (
                    <div className="flex items-center gap-2">
                      <SelIcon className="size-3.5 text-muted-foreground" />
                      <span>{sel.label}</span>
                    </div>
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} side="bottom" align="start">
              <SelectGroup>
                {PERIOD_OPTIONS.map((opt) => {
                  const OptIcon = opt.icon;
                  return (
                    <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                      <div className="flex items-center gap-2 py-0.5">
                        <OptIcon className="size-3.5 text-muted-foreground shrink-0" />
                        <div className="flex flex-col text-left">
                          <span className="font-medium text-xs text-foreground">{opt.label}</span>
                          <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range if Period is CUSTOM */}
        {period === "CUSTOM" && (
          <div className="grid grid-cols-2 gap-2 border border-border/80 rounded-lg p-3 bg-muted/20">
            <div className="space-y-1">
              <Label htmlFor="start-date" className="text-[11px] font-semibold flex items-center gap-1">
                <CalendarIcon className="size-3 text-muted-foreground" />
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="bg-card"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end-date" className="text-[11px] font-semibold flex items-center gap-1">
                <CalendarIcon className="size-3 text-muted-foreground" />
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="bg-card"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {/* Rollover Type Selection */}
        {period !== "CUSTOM" && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Rollover Mode
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                type="button"
                variant={rolloverType === "RESET" ? "secondary" : "outline"}
                onClick={() => setRolloverType("RESET")}
                className={`flex flex-col items-start justify-start gap-1 h-auto p-2.5 text-left text-xs transition-colors cursor-pointer ${
                  rolloverType === "RESET"
                    ? "border-primary bg-primary/10 text-foreground font-medium shadow-xs ring-1 ring-primary"
                    : "border-border bg-card/50 text-muted-foreground hover:bg-accent/40"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                  <RotateCcwIcon className="size-3.5 text-primary" />
                  {resetTitle}
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug whitespace-normal">
                  {resetSubtitle}
                </p>
              </Button>

              <Button
                type="button"
                variant={rolloverType === "CARRY_OVER" ? "secondary" : "outline"}
                onClick={() => setRolloverType("CARRY_OVER")}
                className={`flex flex-col items-start justify-start gap-1 h-auto p-2.5 text-left text-xs transition-colors cursor-pointer ${
                  rolloverType === "CARRY_OVER"
                    ? "border-primary bg-primary/10 text-foreground font-medium shadow-xs ring-1 ring-primary"
                    : "border-border bg-card/50 text-muted-foreground hover:bg-accent/40"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                  <SparklesIcon className="size-3.5 text-primary" />
                  Carry Over Surplus
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug whitespace-normal">
                  {carryOverSubtitle}
                </p>
              </Button>
            </div>
          </div>
        )}

        {/* Accent Color Selection */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Accent Color</Label>
          <div className="flex items-center gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`size-6 rounded-full transition-transform cursor-pointer ${
                  color === c
                    ? "scale-115 ring-2 ring-primary ring-offset-2"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
              >
                {color === c && (
                  <CheckIcon className="size-3 text-white mx-auto stroke-3" />
                )}
              </button>
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="size-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
              title="Choose custom color"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2 cursor-pointer">
            {isLoading && <Loader2Icon className="size-3.5 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Budget"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function BudgetDialog({
  open,
  onOpenChange,
  budgetToEdit,
  onSuccess,
}: BudgetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 max-h-[90vh] overflow-y-auto">
        {open && (
          <BudgetForm
            key={budgetToEdit?.id ?? "new"}
            budgetToEdit={budgetToEdit}
            onSuccess={onSuccess}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
