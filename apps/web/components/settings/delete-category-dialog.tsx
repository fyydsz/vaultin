"use client";

import React, { useState } from "react";
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
import { Loader2Icon, AlertTriangleIcon } from "lucide-react";
import { getCategoryIcon } from "@/components/category-select";
import { toast } from "sonner";

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryItem | null;
  onDeleted?: () => void;
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  onDeleted,
}: DeleteCategoryDialogProps) {
  const { deleteCategory } = useCategoryStore();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!category) return null;

  const IconComponent = getCategoryIcon(category.icon);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteCategory(category.id);
      toast.success(`Category "${category.name}" deleted`);
      onOpenChange(false);
      onDeleted?.();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete category";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6">
        <DialogHeader className="gap-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-1 mx-auto">
            <AlertTriangleIcon className="size-5" />
          </div>
          <DialogTitle className="text-center text-base font-bold text-foreground">
            Delete Custom Category?
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              &ldquo;{category.name}&rdquo;
            </span>
            ? Your past transactions assigned to this category will not be lost, but this category will no longer be available for new entries.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border/70 bg-card p-3 flex items-center gap-3">
          <span
            className="flex size-8 items-center justify-center rounded-lg text-white shadow-2xs shrink-0"
            style={{ backgroundColor: category.color || "#64748B" }}
          >
            <IconComponent className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">
              {category.name}
            </div>
            <div className="text-[10px] text-muted-foreground capitalize">
              {category.type.toLowerCase()} Category
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs gap-1.5 cursor-pointer font-semibold"
          >
            {isDeleting && <Loader2Icon className="size-3.5 animate-spin" />}
            Delete Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
