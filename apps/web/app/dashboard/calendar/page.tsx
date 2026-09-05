"use client";

import { CalendarDaysIcon } from "lucide-react";
import { PlaceholderSection } from "@/components/placeholder-section";

export default function CalendarPage() {
  return (
    <PlaceholderSection
      icon={CalendarDaysIcon}
      category="Overview"
      title="Financial Calendar"
      description="Visualize your income, upcoming bills, planned expenses, and daily saving goals in an interactive calendar view."
      actionText="Add Schedule"
    />
  );
}
