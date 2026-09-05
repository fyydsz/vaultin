"use client";

import React, { useState } from "react";
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
import { Loader2Icon, AlertTriangleIcon } from "lucide-react";
import { toast } from "sonner";

interface DeleteLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: LabelItem | null;
  onDeleted?: () => void;
}

export function DeleteLabelDialog({
  open,
  onOpenChange,
  label,
  onDeleted,
}: DeleteLabelDialogProps) {
  const { deleteLabel } = useLabelStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!label) return;
    setIsDeleting(true);

    try {
      await deleteLabel(label.id);
      toast.success(`Label "#${label.name}" deleted`);
      onOpenChange(false);
      onDeleted?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete label";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6">
        <DialogHeader className="gap-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-1">
            <AlertTriangleIcon className="size-5" />
          </div>
          <DialogTitle className="text-base font-bold text-foreground">
            Delete Label
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete label{" "}
            <span className="font-semibold text-foreground">
              &quot;#{label?.name}&quot;
            </span>
            ? It will be removed from all assigned transactions. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 pt-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-1.5 text-xs font-semibold"
          >
            {isDeleting && <Loader2Icon className="size-3 animate-spin" />}
            Delete Label
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
