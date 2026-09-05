"use client";

import { TargetIcon } from "lucide-react";
import { PlaceholderSection } from "@/components/placeholder-section";

export default function GoalsPage() {
  return (
    <PlaceholderSection
      icon={TargetIcon}
      category="Savings & Budgets"
      title="Savings Goals"
      description="Create and track your financial milestones, monitor progress bars, and configure automated saving allocations."
      actionText="Create Goal"
    />
  );
}
