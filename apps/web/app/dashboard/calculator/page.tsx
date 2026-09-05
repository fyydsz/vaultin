"use client";

import { CalculatorIcon } from "lucide-react";
import { PlaceholderSection } from "@/components/placeholder-section";

export default function CalculatorPage() {
  return (
    <PlaceholderSection
      icon={CalculatorIcon}
      category="Tools & Analytics"
      title="Savings Calculator & Simulation"
      description="Estimate your savings growth by entering regular deposits, target timelines, or compound interest projections."
      actionText="Start Simulation"
    />
  );
}
