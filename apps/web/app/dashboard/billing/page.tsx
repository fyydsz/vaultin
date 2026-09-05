"use client";

import { CreditCardIcon } from "lucide-react";
import { PlaceholderSection } from "@/components/placeholder-section";

export default function BillingPage() {
  return (
    <PlaceholderSection
      icon={CreditCardIcon}
      category="User Settings"
      title="Subscription & Billing"
      description="View your active plan (Free / Pro), manage payment methods, and review billing invoices for premium features."
      actionText="Upgrade Plan"
    />
  );
}
