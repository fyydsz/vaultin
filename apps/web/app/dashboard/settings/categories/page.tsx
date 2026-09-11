"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CategoryItem } from "@/lib/api";
import { useCategoryStore } from "@/stores/category-store";
import { CategoryDialog } from "@/components/settings/category-dialog";
import { DeleteCategoryDialog } from "@/components/settings/delete-category-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusIcon,
  SearchIcon,
  XIcon,
  Edit2Icon,
  Trash2Icon,
  LockIcon,
  SparklesIcon,
  TagIcon,
  ArrowUpDownIcon,
  RefreshCwIcon,
} from "lucide-react";
import { getCategoryIcon } from "@/components/category-select";

export default function CategoriesSettingsPage() {
  const { categories, isLoading, isFetched, fetchCategories } = useCategoryStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<"ALL" | "DEFAULT" | "CUSTOM">("ALL");
  const [filterType, setFilterType] = useState<"ALL" | "EXPENSE" | "INCOME">("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredAndSortedCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let result = categories;

    // Filter by source (default vs custom)
    if (filterSource === "DEFAULT") {
      result = result.filter((c) => c.isDefault !== false);
    } else if (filterSource === "CUSTOM") {
      result = result.filter((c) => c.isDefault === false);
    }

    // Filter by type (expense vs income)
    if (filterType !== "ALL") {
      result = result.filter((c) => c.type === filterType);
    }

    // Search query
    if (query) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.slug.toLowerCase().includes(query) ||
          (c.description && c.description.toLowerCase().includes(query))
      );
    }

    return [...result].sort((a, b) => {
      // Put custom categories first if sorting alphabetically or by custom status
      const cmp = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [categories, searchQuery, filterSource, filterType, sortOrder]);

  const defaultCount = useMemo(
    () => categories.filter((c) => c.isDefault !== false).length,
    [categories]
  );
  const customCount = useMemo(
    () => categories.filter((c) => c.isDefault === false).length,
    [categories]
  );

  const handleOpenCreate = () => {
    setCategoryToEdit(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setCategoryToEdit(cat);
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (cat: CategoryItem) => {
    setCategoryToDelete(cat);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Categories settings
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your custom transaction categories or explore system defaults
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchCategories(true)}
            disabled={isLoading}
            className="h-8 gap-1.5 text-xs cursor-pointer"
          >
            <RefreshCwIcon
              className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreate}
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <PlusIcon className="size-3.5" />
            New Category
          </Button>
        </div>
      </div>

      {/* Action Bar: Search, Source Filter, Type Filter */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="h-9 text-xs pl-8 pr-8 w-full bg-input/20 dark:bg-input/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                aria-label="Clear search"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

          {/* Sort order toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="h-9 gap-1.5 text-xs cursor-pointer shrink-0"
          >
            <ArrowUpDownIcon className="size-3.5" />
            <span>Name ({sortOrder.toUpperCase()})</span>
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50">
          {/* Source Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: `All (${categories.length})` },
              { id: "DEFAULT", label: `System Defaults (${defaultCount})` },
              { id: "CUSTOM", label: `Custom (${customCount})` },
            ].map((tab) => (
              <Button
                key={tab.id}
                type="button"
                size="xs"
                variant={filterSource === tab.id ? "default" : "outline"}
                onClick={() => setFilterSource(tab.id as any)}
                className={`rounded-full px-3 h-7 text-xs cursor-pointer ${
                  filterSource === tab.id
                    ? "font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Type Tabs */}
          <div className="flex items-center gap-1">
            {[
              { id: "ALL", label: "All Types" },
              { id: "EXPENSE", label: "Expense" },
              { id: "INCOME", label: "Income" },
            ].map((tab) => (
              <Button
                key={tab.id}
                type="button"
                size="xs"
                variant={filterType === tab.id ? "secondary" : "ghost"}
                onClick={() => setFilterType(tab.id as any)}
                className="h-6.5 text-[11px] px-2 cursor-pointer font-medium"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Cards Grid */}
      {filteredAndSortedCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAndSortedCategories.map((category) => {
            const IconComponent = getCategoryIcon(category.icon);
            const isCustom = category.isDefault === false;

            return (
              <div
                key={category.id || category.slug}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:border-border transition-colors shadow-2xs gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white shadow-2xs"
                    style={{ backgroundColor: category.color || "#64748B" }}
                  >
                    <IconComponent className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {category.name}
                      </span>
                      {isCustom ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded border border-primary/20 bg-primary/10 text-primary">
                          Custom
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.2 rounded border border-border bg-muted/50 text-muted-foreground">
                          <LockIcon className="size-2.5" />
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span
                        className={`font-medium ${
                          category.type === "INCOME"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {category.type === "INCOME" ? "Income" : "Expense"}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[10px] truncate">
                        {category.slug}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {isCustom ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleOpenEdit(category)}
                        className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Edit category"
                      >
                        <Edit2Icon className="size-3.5" />
                        <span className="sr-only">Edit category</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleOpenDelete(category)}
                        className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2Icon className="size-3.5" />
                        <span className="sr-only">Delete category</span>
                      </Button>
                    </>
                  ) : (
                    <span
                      className="text-[11px] text-muted-foreground/60 px-2 select-none"
                      title="System preset categories cannot be deleted or modified"
                    >
                      Preset
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/30 p-6 text-center animate-in fade-in-50">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2.5">
            <TagIcon className="size-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {searchQuery
              ? "No categories match your search"
              : filterSource === "CUSTOM"
              ? "No Custom Categories Yet"
              : "No Categories Found"}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search terms or reset the filters."
              : filterSource === "CUSTOM"
              ? "Create your own custom categories for hobbies, side projects, or unique expenses."
              : "No categories match the active filter criteria."}
          </p>
          {filterSource === "CUSTOM" && !searchQuery && (
            <Button
              type="button"
              size="sm"
              onClick={handleOpenCreate}
              className="mt-3.5 gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <PlusIcon className="size-3.5" />
              Create Custom Category
            </Button>
          )}
        </div>
      )}

      {/* Add / Edit Category Dialog */}
      <CategoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        categoryToEdit={categoryToEdit}
      />

      {/* Delete Category Confirmation Dialog */}
      <DeleteCategoryDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        category={categoryToDelete}
      />
    </div>
  );
}
