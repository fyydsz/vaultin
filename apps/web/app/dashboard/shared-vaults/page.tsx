"use client";

import { UsersIcon } from "lucide-react";
import { PlaceholderSection } from "@/components/placeholder-section";

export default function SharedVaultsPage() {
  return (
    <PlaceholderSection
      icon={UsersIcon}
      category="Savings & Budgets"
      title="Shared Vaults"
      description="Pool funds together with friends or family for vacations, joint gifts, or group projects with full transparency."
      actionText="Create Shared Vault"
    />
  );
}
