"use client";

import { PieChartIcon } from "lucide-react";
import { PlaceholderSection } from "@/components/placeholder-section";

export default function AnalyticsPage() {
  return (
    <PlaceholderSection
      icon={PieChartIcon}
      category="Tools & Analytics"
      title="Reports & Analytics"
      description="In-depth analytics on cashflow trends, savings ratio comparisons, monthly expense breakdown, and export to PDF/Excel."
      actionText="Download Report"
    />
  );
}
