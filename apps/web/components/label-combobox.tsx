"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { LabelItem } from "@/lib/api";
import { useLabelStore } from "@/stores/label-store";
import {
  TagIcon,
  PlusIcon,
  CheckIcon,
  XIcon,
  Loader2Icon,
  ChevronDownIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface LabelComboboxProps {
  selectedLabels: string[];
  onChange: (labels: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxLabels?: number;
}

export function LabelCombobox({
  selectedLabels = [],
  onChange,
  placeholder = "Search or create labels",
  disabled = false,
  className = "",
  maxLabels = 5,
}: LabelComboboxProps) {
  const {
    labels,
    isLoading: isStoreLoading,
    isFetched,
    fetchLabels,
    createLabel,
    deleteLabel,
  } = useLabelStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Delete label state & dialog
  const [labelToDelete, setLabelToDelete] = useState<LabelItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const isLoading = isStoreLoading && !isFetched;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const trimmedQuery = searchQuery.trim();

  // Filtered existing labels
  const filteredLabels = useMemo(() => {
    if (!trimmedQuery) return labels;
    const q = trimmedQuery.toLowerCase();
    return labels.filter((l) => l.name.toLowerCase().includes(q));
  }, [labels, trimmedQuery]);

  // Check if query matches any existing label exactly
  const exactMatchExists = useMemo(() => {
    if (!trimmedQuery) return true;
    const q = trimmedQuery.toLowerCase();
    return labels.some((l) => l.name.toLowerCase() === q);
  }, [labels, trimmedQuery]);

  const handleSelectLabel = (labelName: string) => {
    if (selectedLabels.includes(labelName)) {
      onChange(selectedLabels.filter((l) => l !== labelName));
    } else {
      if (selectedLabels.length >= maxLabels) {
        return;
      }
      onChange([...selectedLabels, labelName]);
    }
    setSearchQuery("");
  };

  const handleRemoveLabel = (e: React.MouseEvent, labelName: string) => {
    e.stopPropagation();
    onChange(selectedLabels.filter((l) => l !== labelName));
  };

  const handleCreateLabel = async () => {
    if (!trimmedQuery || isCreating) return;
    setCreateError("");
    setIsCreating(true);

    try {
      const createdLabel = await createLabel({ name: trimmedQuery });

      // Automatically select the new label
      if (!selectedLabels.includes(createdLabel.name)) {
        onChange([...selectedLabels, createdLabel.name]);
      }

      setSearchQuery("");
      setIsOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create label";
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmDeleteLabel = async () => {
    if (!labelToDelete) return;
    setIsDeleting(true);
    try {
      await deleteLabel(labelToDelete.id);
      if (selectedLabels.includes(labelToDelete.name)) {
        onChange(selectedLabels.filter((l) => l !== labelToDelete.name));
      }
      setLabelToDelete(null);
    } catch (err: unknown) {
      console.error("Failed to delete label:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (trimmedQuery && !exactMatchExists) {
        handleCreateLabel();
      } else if (filteredLabels.length > 0) {
        handleSelectLabel(filteredLabels[0].name);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <>
      <div ref={containerRef} className={`relative w-full ${className}`}>
        {/* Combobox Main Input / Trigger Area */}
        <div
          onClick={() => {
            if (!disabled) {
              setIsOpen(true);
              inputRef.current?.focus();
            }
          }}
          className={cn(
            "flex w-full min-w-0 flex-wrap items-center gap-1.5 rounded-md border border-input bg-input/20 px-2.5 py-1 text-xs transition-colors outline-none cursor-text dark:bg-input/30 dark:hover:bg-input/40",
            className || "min-h-7",
            isOpen
              ? "border-ring ring-2 ring-ring/30"
              : "hover:bg-input/30",
            disabled ? "cursor-not-allowed opacity-50 pointer-events-none" : ""
          )}
        >
          <TagIcon className="size-3.5 text-muted-foreground shrink-0" />

          {/* Selected Label Chips */}
          {selectedLabels.map((name) => {
            const lblObj = labels.find(
              (l) => l.name.toLowerCase() === name.toLowerCase()
            );
            const color = lblObj?.color || "#64748B";

            return (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 rounded bg-secondary text-secondary-foreground border border-border/80 px-1.5 py-0.2 text-[11px] font-medium shadow-2xs animate-in fade-in zoom-in-95 duration-100"
              >
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span>#{name}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveLabel(e, name)}
                    className="rounded-full hover:bg-muted-foreground/20 p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title={`Remove #${name}`}
                  >
                    <XIcon className="size-2.5" />
                  </button>
                )}
              </span>
            );
          })}

          {/* Search Input inline or placeholder */}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedLabels.length === 0 ? placeholder : "Add more..."
            }
            disabled={disabled}
            className="flex-1 min-w-20 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed py-0.5"
          />

          <div className="flex items-center gap-1 ml-auto shrink-0">
            {isLoading && (
              <Loader2Icon className="size-3 animate-spin text-muted-foreground" />
            )}
            <ChevronDownIcon
              className={`size-3.5 text-muted-foreground transition-transform duration-150 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {/* Dropdown Menu Popup */}
        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 animate-in fade-in-0 zoom-in-95 overflow-hidden">
            {createError && (
              <div className="bg-destructive/10 p-2 text-[11px] text-destructive border-b border-destructive/20">
                {createError}
              </div>
            )}

            {/* List of actions and labels */}
            <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
              {/* Create option if user is typing and no exact match exists */}
              {trimmedQuery && !exactMatchExists && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCreateLabel}
                  disabled={isCreating}
                  className="w-full justify-start gap-2 px-2 py-1.5 h-8 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                >
                  {isCreating ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <PlusIcon className="size-3.5 shrink-0" />
                  )}
                  <span className="truncate">
                    Create &quot;
                    <span className="underline font-bold">{trimmedQuery}</span>
                    &quot; label
                  </span>
                </Button>
              )}

              {/* Existing Labels List */}
              {filteredLabels.length > 0 ? (
                filteredLabels.map((lbl) => {
                  const isSelected = selectedLabels.includes(lbl.name);
                  return (
                    <div
                      key={lbl.id || lbl.name}
                      onClick={() => handleSelectLabel(lbl.name)}
                      className={`group/label-item flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors select-none ${
                        isSelected
                          ? "bg-accent text-accent-foreground font-semibold"
                          : "text-popover-foreground hover:bg-accent/70 hover:text-accent-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: lbl.color || "#64748B" }}
                        />
                        <span className="truncate font-medium">#{lbl.name}</span>
                      </div>

                      {/* Right side: Checkmark & Delete Button */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {isSelected && (
                          <CheckIcon className="size-3.5 text-primary shrink-0" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLabelToDelete(lbl);
                          }}
                          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title={`Delete label "${lbl.name}"`}
                        >
                          <XIcon className="size-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : !trimmedQuery ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  <TagIcon className="size-5 mx-auto mb-1 opacity-40" />
                  No labels created yet.
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                    Type above to create a new label.
                  </p>
                </div>
              ) : exactMatchExists ? null : (
                <div className="py-2 text-center text-[11px] text-muted-foreground">
                  Press Enter or click above to create.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Label Confirmation Alert Dialog */}
      <Dialog
        open={!!labelToDelete}
        onOpenChange={(open) => !open && setLabelToDelete(null)}
      >
        <DialogContent className="max-w-xs p-5">
          <DialogHeader className="gap-1.5">
            <DialogTitle className="text-sm font-bold text-foreground">
              Delete Label?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete the label{" "}
              <span className="font-semibold text-foreground">
                &quot;#{labelToDelete?.name}&quot;
              </span>
              ? This label will be removed from all associated transactions and
              records. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLabelToDelete(null)}
              disabled={isDeleting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDeleteLabel}
              disabled={isDeleting}
              className="gap-1.5 text-xs font-semibold"
            >
              {isDeleting && <Loader2Icon className="size-3 animate-spin" />}
              Delete Label
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
