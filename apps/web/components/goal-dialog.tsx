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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Goal,
  CreateGoalInput,
  UpdateGoalInput,
  api,
} from "@/lib/api";
import { Loader2Icon, AlertCircleIcon, CalendarIcon } from "lucide-react";
import { GOAL_CATEGORY_CONFIG } from "@/components/goal-card";

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalToEdit?: Goal | null;
  onSuccess: (goal: Goal) => void;
}

interface GoalFormProps {
  goalToEdit?: Goal | null;
  onSuccess: (goal: Goal) => void;
  onClose: () => void;
}

function GoalForm({ goalToEdit, onSuccess, onClose }: GoalFormProps) {
  const isEditing = !!goalToEdit;

  const [title, setTitle] = useState(goalToEdit?.title || "");
  const [description, setDescription] = useState(goalToEdit?.description || "");
  const [targetAmount, setTargetAmount] = useState<string>(
    goalToEdit?.targetAmount ? goalToEdit.targetAmount.toString() : ""
  );
  const [category, setCategory] = useState<string>(
    goalToEdit?.category || "general"
  );
  const [deadline, setDeadline] = useState<string>(
    goalToEdit?.deadline
      ? new Date(goalToEdit.deadline).toISOString().slice(0, 10)
      : ""
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCategoryChange = (val: string | null) => {
    if (!val) return;
    setCategory(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage("Goal title is required");
      return;
    }
    if (trimmedTitle.length > 100) {
      setErrorMessage("Goal title cannot exceed 100 characters");
      return;
    }

    const numTarget = parseFloat(targetAmount);
    if (isNaN(numTarget) || numTarget <= 0) {
      setErrorMessage("Target savings amount must be greater than 0");
      return;
    }

    const categoryMeta = GOAL_CATEGORY_CONFIG[category] || GOAL_CATEGORY_CONFIG.general;
    const autoIcon = categoryMeta.defaultIcon;

    try {
      setIsLoading(true);
      if (isEditing && goalToEdit) {
        const updateData: UpdateGoalInput = {
          title: trimmedTitle,
          description: description.trim() || undefined,
          targetAmount: numTarget,
          category,
          icon: autoIcon,
          deadline: deadline || undefined,
          status: goalToEdit.status as any,
        };
        const res = await api.updateGoal(goalToEdit.id, updateData);
        onSuccess(res.goal);
      } else {
        const createData: CreateGoalInput = {
          title: trimmedTitle,
          description: description.trim() || undefined,
          targetAmount: numTarget,
          category,
          icon: autoIcon,
          deadline: deadline || undefined,
        };
        const res = await api.createGoal(createData);
        onSuccess(res.goal);
      }
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save goal";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DialogHeader className="gap-1.5">
        <DialogTitle className="text-lg font-bold">
          {isEditing ? "Edit Savings Goal" : "Create New Savings Goal"}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Update your savings milestone, target amount, or target date."
            : "Define a financial target, milestone date, and start allocating savings."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {errorMessage && (
          <Alert variant="destructive" className="animate-in fade-in-50">
            <AlertCircleIcon className="size-4 shrink-0" />
            <AlertTitle className="font-semibold">
              {isEditing ? "Failed to update goal" : "Failed to create goal"}
            </AlertTitle>
            <AlertDescription className="text-xs text-destructive/90">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Goal Title */}
        <div className="space-y-1.5">
          <Label htmlFor="goal-title" className="text-xs font-semibold">
            Goal Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="goal-title"
            placeholder="e.g. 6-Month Emergency Fund, Japan Trip, New Laptop"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            disabled={isLoading}
          />
        </div>

        {/* Category Selection with Icon & Label formatting */}
        <div className="space-y-1.5">
          <Label htmlFor="goal-category" className="text-xs font-semibold">
            Category <span className="text-destructive">*</span>
          </Label>
          <Select
            value={category}
            onValueChange={handleCategoryChange}
            disabled={isLoading}
          >
            <SelectTrigger id="goal-category" className="w-full bg-card text-xs cursor-pointer">
              <SelectValue placeholder="Select category">
                {(() => {
                  const meta = GOAL_CATEGORY_CONFIG[category];
                  if (!meta) return "Select category";
                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-base select-none">{meta.defaultIcon}</span>
                      <span className="font-medium text-xs text-foreground">{meta.label}</span>
                    </div>
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} side="bottom" align="start">
              <SelectGroup>
                {Object.entries(GOAL_CATEGORY_CONFIG).map(([key, item]) => (
                  <SelectItem key={key} value={key} className="cursor-pointer">
                    <div className="flex items-center gap-2 py-0.5">
                      <span className="text-base select-none">{item.defaultIcon}</span>
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Target Amount */}
        <div className="space-y-1.5">
          <Label htmlFor="goal-target" className="text-xs font-semibold">
            Target Amount <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
              Rp
            </span>
            <Input
              id="goal-target"
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 15000000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="pl-9 font-mono"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Target Date / Deadline */}
        <div className="space-y-1.5">
          <Label htmlFor="goal-deadline" className="text-xs font-semibold flex items-center gap-1">
            <CalendarIcon className="size-3 text-muted-foreground" />
            Target Deadline (Optional)
          </Label>
          <Input
            id="goal-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="bg-card"
            disabled={isLoading}
          />
          <p className="text-[11px] text-muted-foreground">
            Setting a deadline helps calculate daily or monthly savings targets automatically.
          </p>
        </div>


        {/* Description / Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="goal-desc" className="text-xs font-semibold">
            Description & Notes (Optional)
          </Label>
          <Textarea
            id="goal-desc"
            placeholder="Write why this goal matters to you or any milestones..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={2}
            className="text-xs resize-none"
            disabled={isLoading}
          />
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2 cursor-pointer">
            {isLoading && <Loader2Icon className="size-3.5 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Goal"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function GoalDialog({
  open,
  onOpenChange,
  goalToEdit,
  onSuccess,
}: GoalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 sm:p-6 max-h-[90dvh] overflow-y-auto">
        {open && (
          <GoalForm
            key={goalToEdit?.id ?? "new"}
            goalToEdit={goalToEdit}
            onSuccess={onSuccess}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
