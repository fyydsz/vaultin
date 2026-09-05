"use client";

import { UsersIcon } from "lucide-react";
import { PlaceholderSection } from "@/components/placeholder-section";

export default function SocialsPage() {
  return (
    <PlaceholderSection
      icon={UsersIcon}
      category="Community & Friends"
      title="Friends List"
      description="Manage your saving buddy circle, invite friends via username or email, and challenge each other to group savings milestones."
    />
  );
}
