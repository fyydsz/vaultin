"use client";

import React, { useState, useEffect } from "react";
import { LabelItem } from "@/lib/api";
import { useLabelStore } from "@/stores/label-store";
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
import { Loader2Icon, TagIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";

interface LabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labelToEdit?: LabelItem | null;
  onSaved?: () => void;
}

const PRESET_COLORS = [
  { name: "Blue", hex: "#3B82F6" },
  { name: "Indigo", hex: "#6366F1" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Red", hex: "#EF4444" },
  { name: "Orange", hex: "#F97316" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Sky", hex: "#0EA5E9" },
  { name: "Slate", hex: "#64748B" },
];

export function LabelDialog({
  open,
  onOpenChange,
  labelToEdit,
  onSaved,
}: LabelDialogProps) {
  const { createLabel, updateLabel } = useLabelStore();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(labelToEdit);

  useEffect(() => {
    if (open) {
      if (labelToEdit) {
        setName(labelToEdit.name);
        setColor(labelToEdit.color || "#3B82F6");
      } else {
        setName("");
        setColor("#3B82F6");
      }
      setError(null);
    }
  }, [open, labelToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Label name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && labelToEdit) {
        await updateLabel(labelToEdit.id, {
          name: trimmedName,
          color,
        });
        toast.success("Label updated successfully");
      } else {
        await createLabel({
          name: trimmedName,
          color,
        });
        toast.success("Label created successfully");
      }

      onOpenChange(false);
      onSaved?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save label";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-base font-bold text-foreground">
            {isEditing ? "Edit Label" : "Create Label"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditing
              ? "Update label details and color badge."
              : "Create a new label to organize and tag your transactions."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          {/* Label Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Label Name
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-xs font-medium text-muted-foreground select-none">
                #
              </span>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. Groceries, Freelance, Tax"
                className="pl-6 h-9 text-sm"
                autoFocus
                disabled={isSubmitting}
                maxLength={50}
              />
            </div>
          </div>

          {/* Color Selection Field */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              Color Tag
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((preset) => {
                const isSelected =
                  color.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setColor(preset.hex)}
                    title={preset.name}
                    className={`relative flex h-8 w-full items-center justify-center rounded-md border transition-all ${
                      isSelected
                        ? "border-foreground ring-2 ring-foreground/20 scale-105"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: preset.hex }}
                  >
                    {isSelected && (
                      <CheckIcon className="size-4 text-white drop-shadow-sm" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Hex input preview */}
            <div className="flex items-center gap-2 pt-1">
              <div
                className="size-7 rounded-md border border-border shrink-0 shadow-2xs"
                style={{ backgroundColor: color }}
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3B82F6"
                className="h-8 text-xs font-mono uppercase"
                disabled={isSubmitting}
              />
              <input
                type="color"
                value={color.startsWith("#") && color.length === 7 ? color : "#3B82F6"}
                onChange={(e) => setColor(e.target.value)}
                className="size-8 cursor-pointer rounded border-0 bg-transparent p-0"
                title="Pick color"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="rounded-lg bg-muted/40 border border-border/50 p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Preview:</span>
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-white shadow-2xs"
              style={{ backgroundColor: color }}
            >
              <TagIcon className="size-3" />
              <span>#{name.trim() || "LabelName"}</span>
            </span>
          </div>

          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !name.trim()}
              className="gap-1.5 text-xs font-semibold"
            >
              {isSubmitting && <Loader2Icon className="size-3 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Label"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
