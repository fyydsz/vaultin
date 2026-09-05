"use client";

import React, { useState, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SearchIcon,
  ChevronsUpDownIcon,
  XIcon,
  CheckIcon,
} from "lucide-react";

export interface FilterOption {
  id: string;
  name: string;
  icon?: React.ReactNode;
  color?: string;
  subtitle?: string;
}

interface FilterMultiSelectProps {
  placeholder: string; // e.g. "Select categories..."
  searchPlaceholder: string; // e.g. "Search categories..."
  options: FilterOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function FilterMultiSelect({
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  options = [],
  selectedIds = [],
  onChange,
  disabled = false,
  className = "",
}: FilterMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        (opt.subtitle && opt.subtitle.toLowerCase().includes(q))
    );
  }, [options, search]);

  const selectedMap = useMemo(() => {
    return new Set(selectedIds);
  }, [selectedIds]);

  const handleToggle = (id: string) => {
    if (selectedMap.has(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.id));
    }
  };

  // Label to show on the trigger button
  const triggerLabel = useMemo(() => {
    if (selectedIds.length === 0) {
      return (
        <span className="text-muted-foreground font-normal text-xs truncate">
          {placeholder}
        </span>
      );
    }

    if (selectedIds.length === 1) {
      const selected = options.find((opt) => opt.id === selectedIds[0]);
      if (selected) {
        return (
          <div className="flex items-center gap-1.5 min-w-0">
            {selected.icon && (
              <span className="shrink-0">{selected.icon}</span>
            )}
            <span className="truncate font-medium text-foreground text-xs">
              {selected.name}
            </span>
          </div>
        );
      }
    }

    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="truncate font-medium text-foreground text-xs">
          {selectedIds.length} selected
        </span>
      </div>
    );
  }, [selectedIds, options, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            className={`w-full min-h-[34px] px-2.5 py-1.5 flex items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted/60 text-xs transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer ${
              disabled ? "opacity-50 pointer-events-none" : ""
            } ${className}`}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1 text-left">
              {triggerLabel}
            </div>
            <ChevronsUpDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
          </button>
        }
      />

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        className="w-[280px] max-w-[90vw] p-2 space-y-2 rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-xl ring-1 ring-foreground/10 z-50"
      >
        {/* Search Header */}
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-7 h-7.5 text-xs bg-muted/40 border-border/70 focus-visible:ring-1"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <XIcon className="size-3" />
            </button>
          )}
        </div>

        {/* Action bar if options > 3 */}
        {options.length > 0 && (
          <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground border-b border-border/40 pb-1">
            <button
              type="button"
              onClick={handleSelectAll}
              className="hover:text-foreground font-medium cursor-pointer"
            >
              {selectedIds.length === options.length
                ? "Deselect All"
                : "Select All"}
            </button>
            {selectedIds.length > 0 && (
              <span className="font-semibold text-primary">
                {selectedIds.length} selected
              </span>
            )}
          </div>
        )}

        {/* Options List with Checkboxes */}
        <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isChecked = selectedMap.has(opt.id);
              return (
                <div
                  key={opt.id}
                  onClick={() => handleToggle(opt.id)}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs select-none ${
                    isChecked
                      ? "bg-primary/10 text-foreground"
                      : "hover:bg-muted/60 text-foreground/90"
                  }`}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => handleToggle(opt.id)}
                    aria-label={`Select ${opt.name}`}
                    className="pointer-events-none"
                  />

                  {opt.icon && (
                    <span className="shrink-0">{opt.icon}</span>
                  )}

                  <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
                    <span className="truncate font-medium">{opt.name}</span>
                    {opt.subtitle && (
                      <span className="text-[10px] text-muted-foreground truncate shrink-0">
                        {opt.subtitle}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-4 text-center text-xs text-muted-foreground">
              No matching results
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
