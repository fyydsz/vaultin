"use client";

import React, { useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCategoryStore } from "@/stores/category-store";
import {
  UtensilsIcon,
  CarIcon,
  ShoppingBagIcon,
  HomeIcon,
  HeartPulseIcon,
  SparklesIcon,
  GraduationCapIcon,
  Gamepad2Icon,
  GiftIcon,
  WalletIcon,
  BriefcaseIcon,
  TrendingUpIcon,
  MoreHorizontalIcon,
  PlusCircleIcon,
  TagIcon,
  FolderIcon,
} from "lucide-react";

// Icon mapping helper
export const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils: UtensilsIcon,
  Car: CarIcon,
  ShoppingBag: ShoppingBagIcon,
  Home: HomeIcon,
  HeartPulse: HeartPulseIcon,
  Sparkles: SparklesIcon,
  GraduationCap: GraduationCapIcon,
  Gamepad2: Gamepad2Icon,
  Gift: GiftIcon,
  Wallet: WalletIcon,
  Briefcase: BriefcaseIcon,
  TrendingUp: TrendingUpIcon,
  MoreHorizontal: MoreHorizontalIcon,
  PlusCircle: PlusCircleIcon,
  Tag: TagIcon,
  Folder: FolderIcon,
};

export function getCategoryIcon(iconName?: string) {
  if (!iconName) return TagIcon;
  return CATEGORY_ICON_MAP[iconName] || TagIcon;
}

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  typeFilter?: "EXPENSE" | "INCOME" | "ALL";
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function CategorySelect({
  value,
  onChange,
  typeFilter = "ALL",
  disabled = false,
  className = "",
  placeholder = "Select Category",
}: CategorySelectProps) {
  const { categories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filter categories according to typeFilter
  const filteredCategories = useMemo(() => {
    if (typeFilter === "INCOME") {
      return categories.filter((c) => c.type === "INCOME");
    }
    if (typeFilter === "EXPENSE") {
      return categories.filter((c) => c.type === "EXPENSE");
    }
    return categories;
  }, [categories, typeFilter]);

  // Income vs Expense lists when showing all
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === "INCOME"),
    [categories]
  );
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "EXPENSE"),
    [categories]
  );

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.slug === value || c.id === value);
  }, [categories, value]);

  return (
    <Select value={value} onValueChange={(val) => val && onChange(val)} disabled={disabled}>
      <SelectTrigger className={cn("w-full text-xs px-3", className || "h-7")}>
        <SelectValue placeholder={placeholder}>
          {selectedCategory ? (
            <div className="flex items-center gap-2">
              <span
                className="flex items-center justify-center size-5 rounded-md text-white shrink-0"
                style={{ backgroundColor: selectedCategory.color || "#64748B" }}
              >
                {React.createElement(getCategoryIcon(selectedCategory.icon), { className: "size-3" })}
              </span>
              <span className="truncate font-medium text-foreground">
                {selectedCategory.name}
              </span>
            </div>
          ) : value ? (
            <div className="flex items-center gap-2">
              <span className="truncate font-medium text-foreground capitalize">
                {value.replace(/_/g, " ")}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        side="bottom"
        align="start"
        sideOffset={4}
        className="max-h-60"
      >
        {typeFilter !== "ALL" ? (
          <SelectGroup>
            {filteredCategories.map((c) => {
              const Icon = getCategoryIcon(c.icon);
              return (
                <SelectItem key={c.slug || c.id} value={c.slug || c.id}>
                  <div className="flex items-center gap-2 py-0.5">
                    <span
                      className="flex items-center justify-center size-5 rounded-md text-white shrink-0"
                      style={{ backgroundColor: c.color || "#64748B" }}
                    >
                      <Icon className="size-3" />
                    </span>
                    <span className="font-medium">{c.name}</span>
                    {c.isDefault === false && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground ml-auto">
                        Custom
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectGroup>
        ) : (
          <>
            {expenseCategories.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-[11px] font-bold text-muted-foreground px-2 pt-1 pb-0.5 uppercase tracking-wider">
                  Expense Categories
                </SelectLabel>
                {expenseCategories.map((c) => {
                  const Icon = getCategoryIcon(c.icon);
                  return (
                    <SelectItem key={c.slug || c.id} value={c.slug || c.id}>
                      <div className="flex items-center gap-2 py-0.5">
                        <span
                          className="flex items-center justify-center size-5 rounded-md text-white shrink-0"
                          style={{ backgroundColor: c.color || "#64748B" }}
                        >
                          <Icon className="size-3" />
                        </span>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            )}

            {expenseCategories.length > 0 && incomeCategories.length > 0 && (
              <SelectSeparator />
            )}

            {incomeCategories.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-[11px] font-bold text-muted-foreground px-2 pt-1 pb-0.5 uppercase tracking-wider">
                  Income Categories
                </SelectLabel>
                {incomeCategories.map((c) => {
                  const Icon = getCategoryIcon(c.icon);
                  return (
                    <SelectItem key={c.slug || c.id} value={c.slug || c.id}>
                      <div className="flex items-center gap-2 py-0.5">
                        <span
                          className="flex items-center justify-center size-5 rounded-md text-white shrink-0"
                          style={{ backgroundColor: c.color || "#64748B" }}
                        >
                          <Icon className="size-3" />
                        </span>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}
