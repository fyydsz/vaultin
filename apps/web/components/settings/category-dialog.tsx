"use client";

import React, { useState, useEffect } from "react";
import { CategoryItem } from "@/lib/api";
import { useCategoryStore } from "@/stores/category-store";
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
import { Loader2Icon, TagIcon, CheckIcon, SparklesIcon } from "lucide-react";
import {
  CATEGORY_ICON_MAP,
  getCategoryIcon,
} from "@/components/category-select";
import { toast } from "sonner";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryToEdit?: CategoryItem | null;
  defaultType?: "EXPENSE" | "INCOME";
  onSaved?: (saved: CategoryItem) => void;
}

const PRESET_COLORS = [
  { name: "Emerald", hex: "#10B981" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Cyan", hex: "#06B6D4" },
  { name: "Sky", hex: "#0EA5E9" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Indigo", hex: "#6366F1" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Red", hex: "#EF4444" },
  { name: "Orange", hex: "#F97316" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Lime", hex: "#84CC16" },
  { name: "Slate", hex: "#64748B" },
];

export function CategoryDialog({
  open,
  onOpenChange,
  categoryToEdit,
  defaultType = "EXPENSE",
  onSaved,
}: CategoryDialogProps) {
  const { createCategory, updateCategory } = useCategoryStore();
  const [name, setName] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">(defaultType);
  const [icon, setIcon] = useState<string>("Tag");
  const [color, setColor] = useState<string>("#3B82F6");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(categoryToEdit);

  useEffect(() => {
    if (open) {
      if (categoryToEdit) {
        setName(categoryToEdit.name);
        setType(categoryToEdit.type || "EXPENSE");
        setIcon(categoryToEdit.icon || "Tag");
        setColor(categoryToEdit.color || "#3B82F6");
        setDescription(categoryToEdit.description || "");
      } else {
        setName("");
        setType(defaultType);
        setIcon(defaultType === "INCOME" ? "Wallet" : "ShoppingBag");
        setColor(defaultType === "INCOME" ? "#10B981" : "#3B82F6");
        setDescription("");
      }
      setError(null);
    }
  }, [open, categoryToEdit, defaultType]);

  const SelectedIcon = getCategoryIcon(icon);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Category name is required");
      return;
    }
    if (trimmedName.length > 60) {
      setError("Category name cannot exceed 60 characters");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let result: CategoryItem;
      if (isEditing && categoryToEdit) {
        result = await updateCategory(categoryToEdit.id, {
          name: trimmedName,
          type,
          icon,
          color,
          description: description.trim() || undefined,
        });
        toast.success(`Category "${result.name}" updated`);
      } else {
        result = await createCategory({
          name: trimmedName,
          type,
          icon,
          color,
          description: description.trim() || undefined,
        });
        toast.success(`Category "${result.name}" created`);
      }

      onOpenChange(false);
      onSaved?.(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save category";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="gap-1.5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-9 items-center justify-center rounded-lg text-white shadow-2xs transition-colors"
              style={{ backgroundColor: color }}
            >
              <SelectedIcon className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {isEditing ? "Edit Category" : "New Category"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isEditing
                  ? "Update your custom category details and appearance."
                  : "Create a custom category for classifying your income and expenses."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-medium">
              {error}
            </div>
          )}

          {/* Type Selector (Expense vs Income) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Category Type <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("EXPENSE")}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-semibold transition-all cursor-pointer ${
                  type === "EXPENSE"
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-2xs"
                    : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <span>Expense</span>
              </button>
              <button
                type="button"
                onClick={() => setType("INCOME")}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-semibold transition-all cursor-pointer ${
                  type === "INCOME"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                    : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <span>Income</span>
              </button>
            </div>
          </div>

          {/* Category Name */}
          <div className="space-y-1.5">
            <Label htmlFor="category-name" className="text-xs font-semibold text-foreground">
              Category Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Subscriptions, Freelance Projects, Pet Care"
              className="text-xs"
              maxLength={60}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Icon Selector Grid */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                Icon
              </Label>
              <span className="text-[11px] text-muted-foreground font-mono">
                {icon}
              </span>
            </div>
            <div className="grid grid-cols-8 gap-1.5 rounded-lg border border-border/70 bg-card p-2 max-h-36 overflow-y-auto">
              {Object.entries(CATEGORY_ICON_MAP).map(([iconKey, IconComponent]) => {
                const isSelected = icon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    title={iconKey}
                    onClick={() => setIcon(iconKey)}
                    className={`flex size-8 items-center justify-center rounded-md transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-2xs scale-105"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <IconComponent className="size-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                Color
              </Label>
              <span className="text-[11px] text-muted-foreground font-mono">
                {color}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 p-1">
              {PRESET_COLORS.map((c) => {
                const isSelected = color.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => setColor(c.hex)}
                    className={`flex size-6 items-center justify-center rounded-full transition-transform cursor-pointer ${
                      isSelected ? "ring-2 ring-primary ring-offset-2 scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && <CheckIcon className="size-3 text-white drop-shadow-xs" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Description */}
          <div className="space-y-1.5">
            <Label htmlFor="category-desc" className="text-xs font-semibold text-foreground">
              Description (Optional)
            </Label>
            <Input
              id="category-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short note about what this category covers"
              className="text-xs"
              maxLength={200}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !name.trim()}
              className="text-xs gap-1.5 font-semibold cursor-pointer"
            >
              {isSubmitting && <Loader2Icon className="size-3.5 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
