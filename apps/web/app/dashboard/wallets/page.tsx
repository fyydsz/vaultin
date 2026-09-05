"use client";

import { WalletIcon } from "lucide-react";
import { PlaceholderSection } from "@/components/placeholder-section";

export default function WalletsPage() {
  return (
    <PlaceholderSection
      icon={WalletIcon}
      category="Tools & Analytics"
      title="Wallets & Funding Sources"
      description="Manage various money vaults you use (BCA, Mandiri, Cash, GoPay, OVO, Bibit) and customize your transaction categories."
      actionText="Add Wallet"
    />
  );
}
