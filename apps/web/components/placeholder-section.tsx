"use client";

import React from "react";
import { LucideIcon, PlusIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PageHeaderProps {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
  actionText,
  onAction,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`.trim()}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          {Icon && <Icon className="size-6 text-primary shrink-0" />}
          {title}
        </h1>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : actionText ? (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onAction}
            className="gap-1.5 text-xs font-semibold cursor-pointer h-9"
          >
            <PlusIcon className="size-4" />
            {actionText}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export interface PlaceholderSectionProps {
  icon?: LucideIcon;
  title: React.ReactNode;
  category?: string;
  description?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PlaceholderSection({
  icon: Icon = SparklesIcon,
  title,
  category,
  description,
  actionText,
  onAction,
  actions,
  children,
  className = "",
}: PlaceholderSectionProps) {
  return (
    <div className={`flex flex-1 flex-col gap-6 p-6 ${className}`.trim()}>
      {/* Top Header matching Transactions Page */}
      <PageHeader
        icon={Icon}
        title={title}
        description={description}
        actions={actions}
        actionText={actionText}
        onAction={onAction}
      />

      {/* Content Area */}
      {children ? (
        children
      ) : (
        <div className="flex min-h-[380px] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 text-center animate-in fade-in-50">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-xs">
            {Icon && <Icon className="size-7" />}
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {typeof title === "string" ? `Section ${title}` : title}
          </h3>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            This section is already connected to the sidebar navigation. Ready to be filled with form components, data tables, or CRUD charts.
          </p>
          <div className="mt-6 flex items-center gap-2 rounded-lg bg-muted/60 px-3.5 py-1.5 text-xs text-muted-foreground font-mono">
            <span>Under development</span>
          </div>
        </div>
      )}
    </div>
  );
}
