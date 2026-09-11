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
import { Goal, api } from "@/lib/api";
import { AlertTriangleIcon, Loader2Icon, AlertCircleIcon } from "lucide-react";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";

interface DeleteGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  onSuccess: (deletedId: string) => void;
}

export function DeleteGoalDialog({
  open,
  onOpenChange,
  goal,
  onSuccess,
}: DeleteGoalDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!goal) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      await api.deleteGoal(goal.id);
      onSuccess(goal.id);
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete goal";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6">
        <DialogHeader className="gap-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto">
            <AlertTriangleIcon className="size-5" />
          </div>
          <DialogTitle className="text-center text-base font-bold text-foreground">
            Delete Savings Goal?
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground font-sans">
              &ldquo;{goal.title}&rdquo;
            </span>
            ? This milestone will be removed. All transactions previously recorded in your vaults will remain safe.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <Alert variant="destructive" className="animate-in fade-in-50">
            <AlertCircleIcon className="size-4 shrink-0" />
            <AlertTitle className="font-semibold">Failed to delete goal</AlertTitle>
            <AlertDescription className="text-xs text-destructive/90">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2 pt-3 sm:justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="flex-1 gap-1.5 cursor-pointer"
          >
            {isLoading && <Loader2Icon className="size-3.5 animate-spin" />}
            Delete Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
