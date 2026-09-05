"use client";

import { BellIcon } from "lucide-react";
import { PlaceholderSection } from "@/components/placeholder-section";

export default function NotificationsPage() {
  return (
    <PlaceholderSection
      icon={BellIcon}
      category="User Settings"
      title="Notification Center"
      description="View all saving reminders, shared vault progress updates, and important system notifications."
      actionText="Mark All as Read"
    />
  );
}
