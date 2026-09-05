"use client";

import React, { useState, useEffect, useMemo } from "react";
import { LabelItem } from "@/lib/api";
import { useLabelStore } from "@/stores/label-store";
import { LabelDialog } from "@/components/settings/label-dialog";
import { DeleteLabelDialog } from "@/components/settings/delete-label-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusIcon,
  SearchIcon,
  ArrowUpDownIcon,
  Edit2Icon,
  Trash2Icon,
  TagIcon,
  Loader2Icon,
} from "lucide-react";

export default function LabelsSettingsPage() {
  const { labels, isLoading, isFetched, fetchLabels } = useLabelStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [labelToEdit, setLabelToEdit] = useState<LabelItem | null>(null);
  const [labelToDelete, setLabelToDelete] = useState<LabelItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const filteredAndSortedLabels = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let result = labels;

    if (query) {
      result = result.filter((lbl) =>
        lbl.name.toLowerCase().includes(query)
      );
    }

    return [...result].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [labels, searchQuery, sortOrder]);

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleOpenCreate = () => {
    setLabelToEdit(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (lbl: LabelItem) => {
    setLabelToEdit(lbl);
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (lbl: LabelItem) => {
    setLabelToDelete(lbl);
    setIsDeleteDialogOpen(true);
  };

  const isInitialLoading = isLoading && !isFetched;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Labels settings
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your transaction labels
        </p>
      </div>

      {/* Action Bar: Filter & Create Label */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter labels..."
            className="h-9 text-xs pl-3 pr-8 w-full bg-input/20 dark:bg-input/30"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          size="default"
          className="h-9 px-4 font-semibold text-xs gap-1.5 shrink-0"
        >
          <PlusIcon className="size-4" />
          Create Label
        </Button>
      </div>

      {/* Labels Table Container */}
      <div className="rounded-xl border border-border/60 bg-card/30 overflow-hidden shadow-2xs">
        {/* Table Header */}
        <div className="grid grid-cols-12 items-center px-4 py-3 border-b border-border/50 text-xs font-semibold text-foreground select-none">
          <div
            onClick={toggleSort}
            className="col-span-6 sm:col-span-7 flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors"
          >
            <span>Name</span>
            <ArrowUpDownIcon className="size-3.5 opacity-70" />
          </div>
          <div className="col-span-4 sm:col-span-3">Color</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Table Content */}
        {isInitialLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2Icon className="size-5 animate-spin" />
            <span className="text-xs">Loading labels...</span>
          </div>
        ) : filteredAndSortedLabels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm font-normal">
            No labels found.
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filteredAndSortedLabels.map((lbl) => {
              const labelColor = lbl.color || "#64748B";
              return (
                <div
                  key={lbl.id}
                  className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-muted/40 transition-colors group"
                >
                  {/* Name */}
                  <div className="col-span-6 sm:col-span-7 flex items-center gap-2.5 truncate font-medium text-foreground">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: labelColor }}
                    />
                    <span className="truncate">#{lbl.name}</span>
                  </div>

                  {/* Color badge */}
                  <div className="col-span-4 sm:col-span-3 flex items-center gap-2">
                    <span
                      className="size-3.5 rounded-full shrink-0 border border-border/80 shadow-2xs"
                      style={{ backgroundColor: labelColor }}
                    />
                    <span className="font-mono text-[11px] text-muted-foreground uppercase">
                      {labelColor}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleOpenEdit(lbl)}
                      className="text-muted-foreground hover:text-foreground"
                      title={`Edit #${lbl.name}`}
                    >
                      <Edit2Icon className="size-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleOpenDelete(lbl)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title={`Delete #${lbl.name}`}
                    >
                      <Trash2Icon className="size-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer count */}
      <div className="text-right text-xs text-muted-foreground pt-1">
        {filteredAndSortedLabels.length} label(s) total.
      </div>

      {/* Create / Edit Dialog */}
      <LabelDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        labelToEdit={labelToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteLabelDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        label={labelToDelete}
      />
    </div>
  );
}
