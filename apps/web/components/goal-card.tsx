"use client";

import React, { useCallback, useMemo } from "react";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Coins,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { Goal, BankVault } from "@/lib/api";

export const GOAL_CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string; defaultIcon: string; badgeClass: string }
> = {
  general: {
    label: "General",
    color: "#8B5CF6",
    defaultIcon: "🎯",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  emergency: {
    label: "Emergency Fund",
    color: "#EF4444",
    defaultIcon: "🏥",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  gadget: {
    label: "Gadget & Tech",
    color: "#06B6D4",
    defaultIcon: "💻",
    badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  },
  travel: {
    label: "Travel & Trip",
    color: "#10B981",
    defaultIcon: "✈️",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  investment: {
    label: "Investment",
    color: "#22C55E",
    defaultIcon: "📈",
    badgeClass: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  education: {
    label: "Education",
    color: "#6366F1",
    defaultIcon: "🎓",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  couple: {
    label: "Couple & Family",
    color: "#EC4899",
    defaultIcon: "💍",
    badgeClass: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  },
};

interface GoalCardProps {
  goal: Goal;
  vaults?: BankVault[];
  onContribute: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
}

export function GoalCard({
  goal,
  vaults = [],
  onContribute,
  onEdit,
  onDelete,
}: GoalCardProps) {
  const formatCurrency = useCallback((val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  }, []);

  const categoryMeta =
    GOAL_CATEGORY_CONFIG[goal.category] || GOAL_CATEGORY_CONFIG.general;
  const accentColor = categoryMeta.color;

  const currentFormatted = useMemo(
    () => formatCurrency(goal.currentAmount || 0),
    [goal.currentAmount, formatCurrency]
  );
  const targetFormatted = useMemo(
    () => formatCurrency(goal.targetAmount || 0),
    [goal.targetAmount, formatCurrency]
  );
  const remaining = useMemo(
    () => Math.max(0, (goal.targetAmount || 0) - (goal.currentAmount || 0)),
    [goal.targetAmount, goal.currentAmount]
  );
  const remainingFormatted = useMemo(
    () => formatCurrency(remaining),
    [remaining, formatCurrency]
  );

  const percentage = useMemo(() => {
    if (!goal.targetAmount || goal.targetAmount <= 0) return 0;
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  }, [goal.currentAmount, goal.targetAmount]);

  const isCompleted =
    goal.status === "completed" ||
    (goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount);

  // Deadline calculations
  const deadlineInfo = useMemo(() => {
    if (!goal.deadline) return null;
    const deadlineDate = new Date(goal.deadline);
    const now = new Date();
    // Normalize to start of day
    const diffMs = deadlineDate.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const formattedDate = new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(goal.deadline));

    let paceText = "";
    if (daysRemaining > 0 && remaining > 0) {
      const dailyNeeded = Math.ceil(remaining / daysRemaining);
      paceText = `Save ~${formatCurrency(dailyNeeded)}/day`;
    }

    return {
      daysRemaining,
      formattedDate,
      paceText,
      isOverdue: daysRemaining < 0 && !isCompleted,
    };
  }, [goal.deadline, remaining, isCompleted, formatCurrency]);

  // Status configuration
  const statusConfig = useMemo(() => {
    if (isCompleted) {
      return {
        label: "Completed",
        badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        progressColor: "bg-emerald-500",
      };
    }
    if (deadlineInfo?.isOverdue) {
      return {
        label: "Overdue",
        badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        progressColor: "bg-rose-500",
      };
    }
    return {
      label: `${percentage}% Saved`,
      badgeClass: "bg-primary/10 text-primary border-primary/20",
      progressColor: "bg-primary",
    };
  }, [isCompleted, deadlineInfo?.isOverdue, percentage]);

  return (
    <Card className="flex flex-col justify-between transition-all duration-200 hover:shadow-md border-border/80 relative group overflow-hidden bg-card/90">
      {/* Top Accent Color Bar */}
      <div
        className="h-1 w-full absolute top-0 left-0 right-0"
        style={{ backgroundColor: accentColor }}
      />

      <CardHeader className="pb-3 pt-4 px-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          {/* Icon & Goal Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-lg shadow-2xs select-none"
              style={{ backgroundColor: `${accentColor}18`, border: `1px solid ${accentColor}35` }}
            >
              {goal.icon || categoryMeta.defaultIcon}
            </span>
            <div className="min-w-0">
              <CardTitle className="text-base font-bold text-foreground truncate">
                {goal.title}
              </CardTitle>
              <CardDescription className="text-[11px] flex items-center gap-1.5 font-medium mt-0.5">
                <span className="capitalize">{categoryMeta.label}</span>
                {goal.isShared && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-0.5 text-primary">
                      <Users className="size-3" />
                      Shared
                    </span>
                  </>
                )}
              </CardDescription>
            </div>
          </div>

          {/* Status Badge & Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusConfig.badgeClass}`}
            >
              {isCompleted && <Sparkles className="size-3" />}
              {statusConfig.label}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                  />
                }
              >
                <MoreVertical className="size-3.5" />
                <span className="sr-only">Actions</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => onEdit(goal)}
                  className="gap-2 text-xs cursor-pointer"
                >
                  <Pencil className="size-3.5" />
                  Edit Goal
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(goal)}
                  className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  Delete Goal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Description if any */}
        {goal.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-0.5">
            {goal.description}
          </p>
        )}

        {/* Saved vs Target & Progress */}
        <div className="space-y-2 border-t border-border/50 pt-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Saved So Far
              </span>
              <div className="text-base font-bold tracking-tight text-foreground font-mono">
                {currentFormatted}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Target Amount
              </span>
              <div className="text-xs font-semibold text-muted-foreground font-mono">
                / {targetFormatted}
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-2 w-full bg-secondary/80 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-500 ${statusConfig.progressColor}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-semibold font-mono text-foreground">
                {percentage}% reached
              </span>
              {isCompleted ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="size-3" />
                  Goal Achieved!
                </span>
              ) : (
                <span>Remaining {remainingFormatted}</span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Middle: Shared Members or Deadline Pace */}
      <CardContent className="py-1 px-4">
        {goal.isShared && goal.members && goal.members.length > 0 ? (
          <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase">
              <span>Contributors ({goal.members.length})</span>
              <span>Total Contributed</span>
            </div>
            <div className="space-y-1">
              {goal.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between text-xs py-0.5"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate text-[11px] font-medium text-foreground">
                      {member.name}
                      {member.role === "creator" && (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          (Creator)
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-foreground shrink-0 ml-2">
                    {formatCurrency(member.totalContributed || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : deadlineInfo?.paceText && !isCompleted ? (
          <div className="flex items-center justify-between text-[11px] bg-primary/5 text-primary border border-primary/20 rounded-md px-2.5 py-1.5">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="size-3" />
              Saving Target Pace:
            </span>
            <span className="font-mono font-bold text-foreground">
              {deadlineInfo.paceText}
            </span>
          </div>
        ) : null}
      </CardContent>

      {/* Footer with Deadline info & Contribute Button */}
      <CardFooter className="flex items-center justify-between border-t border-border/50 py-2.5 px-4 text-xs mt-2">
        <div className="flex items-center gap-1.5 font-medium text-muted-foreground text-[11px] min-w-0">
          {deadlineInfo ? (
            <span
              className={`flex items-center gap-1 font-semibold truncate ${
                deadlineInfo.isOverdue
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground"
              }`}
            >
              <Calendar className="size-3 shrink-0" />
              {deadlineInfo.formattedDate}
              {deadlineInfo.daysRemaining >= 0 && !isCompleted && (
                <span className="font-normal font-sans text-muted-foreground">
                  ({deadlineInfo.daysRemaining} days left)
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground/80 font-normal">
              No target deadline set
            </span>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isCompleted ? (
            <Button
              size="xs"
              variant="outline"
              disabled
              className="h-7 gap-1 text-[11px] font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 pointer-events-none"
            >
              <CheckCircle2 className="size-3.5" />
              <span>Complete</span>
            </Button>
          ) : vaults.length === 0 ? (
            <HoverCard>
              <HoverCardTrigger
                delay={200}
                closeDelay={150}
                render={
                  <span
                    className="inline-block cursor-not-allowed"
                    tabIndex={0}
                  />
                }
              >
                <Button
                  disabled
                  size="xs"
                  className="h-7 gap-1 text-[11px] font-medium px-2.5 pointer-events-none"
                >
                  <Coins className="size-3.5" />
                  <span>+ Add Savings</span>
                </Button>
              </HoverCardTrigger>
              <HoverCardContent side="top" align="end" className="w-68 p-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="size-3.5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-foreground">
                       Vault Required
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      You need at least one vault with balance before contributing to goals.
                    </p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <Button
              size="xs"
              variant="default"
              onClick={() => onContribute(goal)}
              className="h-7 gap-1 text-[11px] font-medium cursor-pointer px-2.5"
            >
              <Coins className="size-3.5" />
              <span>+ Add Savings</span>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
