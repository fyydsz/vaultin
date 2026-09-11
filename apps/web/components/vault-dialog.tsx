"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BankVault,
  CreateVaultInput,
  UpdateVaultInput,
  api,
} from "@/lib/api";
import {
  Building2Icon,
  WalletIcon,
  CreditCardIcon,
  BanknoteIcon,
  CheckIcon,
  Loader2Icon,
  LockIcon,
  TrendingUpIcon,
  PiggyBankIcon,
  LandmarkIcon,
  CircleHelpIcon,
  AlertCircleIcon,
} from "lucide-react";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle
} from "@/components/ui/field"
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { MailWarningIcon } from "lucide-react";

interface VaultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultToEdit?: BankVault | null;
  existingVaultCount?: number;
  onSuccess: (vault: BankVault) => void;
}

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#64748B", // Slate
];

// Provider-specific category mappings
export const CATEGORIES_BY_PROVIDER: Record<
  string,
  Array<{
    value: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>
> = {
  BANK: [
    { value: "SAVINGS", label: "Savings", icon: PiggyBankIcon },
    { value: "CREDIT_CARD", label: "Credit Card", icon: CreditCardIcon },
    { value: "TIME_DEPOSIT", label: "Time Deposit", icon: LandmarkIcon },
    { value: "INVESTMENT", label: "Investment", icon: TrendingUpIcon },
    { value: "OTHER", label: "Other", icon: CircleHelpIcon },
  ],
  E_WALLET: [
    { value: "SAVINGS", label: "Savings", icon: WalletIcon },
    { value: "INVESTMENT", label: "Investment", icon: TrendingUpIcon },
    { value: "OTHER", label: "Other", icon: CircleHelpIcon },
  ],
  CASH: [
    { value: "CASH", label: "Cash", icon: BanknoteIcon },
  ],
  OTHER: [
    { value: "SAVINGS", label: "Savings", icon: PiggyBankIcon },
    { value: "INVESTMENT", label: "Investment", icon: TrendingUpIcon },
    { value: "CREDIT_CARD", label: "Credit Card", icon: CreditCardIcon },
    { value: "LOAN", label: "Loan", icon: LandmarkIcon },
    { value: "OTHER", label: "Other", icon: CircleHelpIcon },
  ],
};

const ALL_CATEGORIES = [
  { value: "SAVINGS", label: "Savings", icon: PiggyBankIcon },
  { value: "CREDIT_CARD", label: "Credit Card", icon: CreditCardIcon },
  { value: "TIME_DEPOSIT", label: "Time Deposit", icon: LandmarkIcon },
  { value: "INVESTMENT", label: "Investment", icon: TrendingUpIcon },
  { value: "LOAN", label: "Loan", icon: LandmarkIcon },
  { value: "CASH", label: "Cash", icon: BanknoteIcon },
  { value: "OTHER", label: "Other", icon: CircleHelpIcon },
];

const PROVIDER_TYPES = [
  { value: "BANK", label: "Bank", icon: Building2Icon },
  { value: "E_WALLET", label: "E-Wallet", icon: WalletIcon },
  { value: "CASH", label: "Cash", icon: BanknoteIcon },
  { value: "OTHER", label: "Other", icon: CreditCardIcon },
];

const POPULAR_PROVIDERS: Record<string, string[]> = {
  BANK: [
    "BCA",
    "Bank Mandiri",
    "BRI",
    "BNI",
    "BSI",
    "Bank Jago",
    "Blu BCA",
    "SeaBank",
    "CIMB Niaga",
  ],
  E_WALLET: ["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja", "Astrapay"],
  CASH: ["Physical Wallet", "Safe Vault", "Cash Envelopes"],
  OTHER: ["Bibit", "Bareksa", "Stockbit", "Ajaib", "Pluang"],
};

interface VaultFormProps {
  vaultToEdit?: BankVault | null;
  existingVaultCount?: number;
  onSuccess: (vault: BankVault) => void;
  onClose: () => void;
}

function VaultForm({ vaultToEdit, existingVaultCount, onSuccess, onClose }: VaultFormProps) {
  const { user, sendVerificationEmail } = useAuth();
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const isEditing = !!vaultToEdit;

  const isUnverifiedLimitReached =
    !isEditing && Boolean(user && !user.emailVerified && (existingVaultCount ?? 0) >= 1);

  const handleResendVerification = async () => {
    if (isSendingVerification) return;
    setIsSendingVerification(true);
    try {
      await sendVerificationEmail();
      toast.success("Verification email sent!", {
        description: `Please check your inbox at ${user?.email}.`,
      });
    } catch (err: any) {
      toast.error("Failed to send email", {
        description: err.message || "Please try again later.",
      });
    } finally {
      setIsSendingVerification(false);
    }
  };

  const isPreset = vaultToEdit?.providerType
    ? POPULAR_PROVIDERS[vaultToEdit.providerType]?.includes(vaultToEdit.providerName)
    : true;

  const [name, setName] = useState(vaultToEdit?.name || "");
  const [accountType, setAccountType] = useState(vaultToEdit?.accountType || "SAVINGS");
  const [providerType, setProviderType] = useState(vaultToEdit?.providerType || "BANK");
  const [providerName, setProviderName] = useState(
    vaultToEdit ? (isPreset ? vaultToEdit.providerName : "custom") : "BCA"
  );
  const [customProvider, setCustomProvider] = useState(
    vaultToEdit && !isPreset ? vaultToEdit.providerName : ""
  );
  const [balance, setBalance] = useState<string>(vaultToEdit?.balance?.toString() || "0");
  const currency = vaultToEdit?.currency || "IDR";
  const [color, setColor] = useState(vaultToEdit?.color || "#3B82F6");
  const [isDefault, setIsDefault] = useState(vaultToEdit?.isDefault || false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (isUnverifiedLimitReached) {
    return (
      <>
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <MailWarningIcon className="size-5 text-amber-500 shrink-0" />
            Email Verification Required
          </DialogTitle>
          <DialogDescription>
            Unverified accounts are limited to 1 vault.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-200 space-y-2">
            <p className="font-semibold">Unlock Unlimited Vaults</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You have reached the limit of 1 vault for unverified accounts. To create additional bank accounts, e-wallets, or cash vaults, please verify your email address (<strong className="text-foreground">{user?.email}</strong>).
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 flex-col-reverse sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleResendVerification}
            disabled={isSendingVerification}
            className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:text-amber-950 font-medium"
          >
            {isSendingVerification ? (
              <>
                <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Verification Email"
            )}
          </Button>
        </DialogFooter>
      </>
    );
  }

  const handleProviderTypeChange = (type: string) => {
    setProviderType(type);
    const presets = POPULAR_PROVIDERS[type];
    if (presets && presets.length > 0) {
      setProviderName(presets[0]);
      setCustomProvider("");
    } else {
      setProviderName("custom");
    }

    // Auto-adjust vault category if current category is not allowed in new provider
    const allowed = CATEGORIES_BY_PROVIDER[type] || CATEGORIES_BY_PROVIDER.OTHER;
    if (!allowed.some((c) => c.value === accountType) && allowed.length > 0) {
      setAccountType(allowed[0].value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Vault name is required");
      return;
    }

    if (trimmedName.length > 100) {
      setErrorMessage("Vault name cannot exceed 100 characters");
      return;
    }

    const finalProviderName =
      providerName === "custom" ? customProvider.trim() : providerName;
    if (!finalProviderName) {
      setErrorMessage("Please specify the provider/institution name");
      return;
    }

    if (finalProviderName.length > 100) {
      setErrorMessage("Provider name cannot exceed 100 characters");
      return;
    }

    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) {
      setErrorMessage("Balance must be a valid number");
      return;
    }

    if (!isEditing && numBalance < 0) {
      setErrorMessage("Initial balance cannot be negative (minimum 0)");
      return;
    }

    try {
      setIsLoading(true);
      if (isEditing && vaultToEdit) {
        const updateData: UpdateVaultInput = {
          name: name.trim(),
          accountType,
          providerType,
          providerName: finalProviderName,
          currency,
          color,
          isDefault,
        };
        const res = await api.updateVault(vaultToEdit.id, updateData);
        onSuccess(res.vault);
      } else {
        const createData: CreateVaultInput = {
          name: name.trim(),
          accountType,
          providerType,
          providerName: finalProviderName,
          balance: numBalance,
          currency,
          color,
          isDefault,
        };
        const res = await api.createVault(createData);
        onSuccess(res.vault);
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save vault";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DialogHeader className="gap-1.5">
        <DialogTitle className="text-lg font-bold">
          {isEditing ? "Edit Vault" : "Add New Vault"}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Update vault details and metadata."
            : "Enter your bank vault, digital wallet, or cash pocket information."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMessage && (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertCircleIcon className="size-4 shrink-0" />
              <AlertTitle className="font-semibold">
                {isEditing ? "Failed to update vault" : "Failed to create vault"}
              </AlertTitle>
              <AlertDescription className="text-xs text-destructive/90">{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Vault Name */}
          <div className="space-y-1.5">
            <Label htmlFor="acc-name" className="text-xs font-semibold">
              Vault Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="acc-name"
              placeholder="e.g. BCA Payroll, Main Savings, GoPay Wallet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              disabled={isLoading}
            />
          </div>

          {/* Provider Type & Preset Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Provider Type</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PROVIDER_TYPES.map((pt) => {
                const Icon = pt.icon;
                const isSelected = providerType === pt.value;
                return (
                  <Button
                    key={pt.value}
                    type="button"
                    variant={isSelected ? "secondary" : "outline"}
                    onClick={() => handleProviderTypeChange(pt.value)}
                    className={`flex flex-col items-center justify-center gap-1.5 h-auto p-2 text-center text-xs transition-colors ${isSelected
                      ? "border-primary bg-primary/10 text-primary font-medium shadow-xs hover:bg-primary/15"
                      : "border-border bg-card/50 text-muted-foreground hover:bg-accent/40"
                      }`}
                  >
                    <Icon className="size-4" />
                    <span>{pt.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Provider Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Bank / Provider Name</Label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(POPULAR_PROVIDERS[providerType] || []).map((prov) => (
                <Button
                  key={prov}
                  type="button"
                  size="sm"
                  variant={providerName === prov ? "default" : "outline"}
                  onClick={() => {
                    setProviderName(prov);
                    setCustomProvider("");
                  }}
                  className="rounded-full px-3 h-7 text-xs font-medium transition-colors cursor-pointer"
                >
                  {prov}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant={providerName === "custom" ? "default" : "outline"}
                onClick={() => setProviderName("custom")}
                className="rounded-full px-3 h-7 text-xs font-medium transition-colors cursor-pointer"
              >
                Other...
              </Button>
            </div>

            {providerName === "custom" && (
              <Input
                placeholder="Type custom provider name..."
                value={customProvider}
                onChange={(e) => setCustomProvider(e.target.value)}
                className="mt-2"
                required
                maxLength={100}
                disabled={isLoading}
              />
            )}
          </div>

          {/* Account Category Type (Provider-Specific) */}
          <div className="space-y-1.5">
            <Label htmlFor="acc-type" className="text-xs font-semibold">
              Account Category
            </Label>
            <Select
              value={accountType}
              onValueChange={(val) => {
                if (val) setAccountType(val);
              }}
              disabled={isLoading}
            >
              <SelectTrigger id="acc-type" className="w-full h-8 bg-card text-xs">
                <SelectValue placeholder="Select account category">
                  {(() => {
                    const sel = ALL_CATEGORIES.find((t) => t.value === accountType);
                    if (!sel) return "Select account category";
                    const SelIcon = sel.icon;
                    return (
                      <div className="flex items-center gap-2">
                        <SelIcon className="size-3.5 text-muted-foreground" />
                        <span>{sel.label}</span>
                      </div>
                    );
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {(CATEGORIES_BY_PROVIDER[providerType] || CATEGORIES_BY_PROVIDER.OTHER).map((t) => {
                    const Icon = t.icon;
                    return (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="size-3.5 text-muted-foreground" />
                          <span>{t.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Initial / Current Balance */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="acc-balance" className="text-xs font-semibold">
                {isEditing ? "Vault Balance" : "Starting Balance"}
              </Label>
              {isEditing && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <LockIcon className="size-3" />
                  Locked during edit
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                Rp
              </span>
              <Input
                id="acc-balance"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className={`pl-9 ${isEditing ? "bg-muted/60 opacity-80 cursor-not-allowed" : ""}`}
                required
                disabled={isLoading || isEditing}
                readOnly={isEditing}
              />
            </div>
            {isEditing ? (
              <p className="text-[11px] text-muted-foreground">
                Account balance cannot be modified here. Use the &quot;Update Balance&quot; button to deposit or withdraw funds.
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Initial starting balance (must be non-negative, minimum 0).
              </p>
            )}
          </div>

          {/* Accent Color Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Accent Color</Label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`size-6 rounded-full transition-transform ${color === c ? "scale-115 ring-2 ring-primary ring-offset-2" : "hover:scale-105"
                    }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && (
                    <CheckIcon className="size-3 text-white mx-auto stroke-3" />
                  )}
                </button>
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="size-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
                title="Choose custom color"
              />
            </div>
          </div>

          {/* Primary Default Account Toggle */}
          <FieldLabel>
            <Field orientation="horizontal">
              <Checkbox
                id="acc-default"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(!!checked)}
                disabled={isLoading}
              />
              <FieldContent>
                <FieldTitle>Set as Primary Vault</FieldTitle>
              </FieldContent>
            </Field>
          </FieldLabel>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2Icon className="size-3.5 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Vault"}
            </Button>
          </DialogFooter>
        </form>
    </>
  );
}

export function VaultDialog({
  open,
  onOpenChange,
  vaultToEdit,
  existingVaultCount,
  onSuccess,
}: VaultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 max-h-[90vh] overflow-y-auto">
        {open && (
          <VaultForm
            key={vaultToEdit?.id ?? "new"}
            vaultToEdit={vaultToEdit}
            existingVaultCount={existingVaultCount}
            onSuccess={onSuccess}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
