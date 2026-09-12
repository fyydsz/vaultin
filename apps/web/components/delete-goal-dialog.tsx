"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Goal, BankVault, api } from "@/lib/api";
import {
  AlertTriangleIcon,
  Loader2Icon,
  AlertCircleIcon,
  ShieldCheckIcon,
  Building2Icon,
  WalletIcon,
  BanknoteIcon,
} from "lucide-react";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";

interface DeleteGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  vaults?: BankVault[];
  onSuccess: (deletedId: string) => void;
}

export function DeleteGoalDialog({
  open,
  onOpenChange,
  goal,
  vaults = [],
  onSuccess,
}: DeleteGoalDialogProps) {
  const defaultVault = vaults.find((v) => v.isDefault) || vaults[0];
  const [selectedRefundVaultId, setSelectedRefundVaultId] = useState<string>(
    defaultVault?.id || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const selectedVault = useMemo(() => {
    return vaults.find((v) => v.id === selectedRefundVaultId) || null;
  }, [vaults, selectedRefundVaultId]);

  const hasSavings = (goal?.currentAmount || 0) > 0;

  const getProviderIcon = (providerType?: string) => {
    switch (providerType) {
      case "BANK":
        return <Building2Icon className="size-3.5" />;
      case "E_WALLET":
        return <WalletIcon className="size-3.5" />;
      case "CASH":
        return <BanknoteIcon className="size-3.5" />;
      default:
        return <WalletIcon className="size-3.5" />;
    }
  };

  if (!goal) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      await api.deleteGoal(
        goal.id,
        hasSavings ? selectedRefundVaultId || undefined : undefined
      );
      onSuccess(goal.id);
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete goal";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 sm:p-6 max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="gap-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto">
            <AlertTriangleIcon className="size-5" />
          </div>
          <DialogTitle className="text-center text-base font-bold text-foreground">
            Delete Savings Goal?
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground font-sans">
              &ldquo;{goal.title}&rdquo;
            </span>
            ? This milestone will be permanently removed.
          </DialogDescription>
        </DialogHeader>

        {/* Safe Refund Notice & Account Selector if goal has funds */}
        {hasSavings && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="flex size-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                <ShieldCheckIcon className="size-3.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-foreground">
                  Automatic Savings Refund
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  You currently have{" "}
                  <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(goal.currentAmount)}
                  </span>{" "}
                  saved in this goal. This full amount will be refunded directly back to your vault.
                </p>
              </div>
            </div>

            {vaults.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-emerald-500/10">
                <Label htmlFor="refund-vault" className="text-[11px] font-semibold text-foreground">
                  Refund to Account
                </Label>
                <Select
                  value={selectedRefundVaultId}
                  onValueChange={(val) => val && setSelectedRefundVaultId(val)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="refund-vault" className="w-full bg-card text-xs cursor-pointer h-8.5">
                    <SelectValue placeholder="Select refund destination">
                      {selectedVault ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="flex size-3.5 items-center justify-center rounded text-white shrink-0"
                            style={{ backgroundColor: selectedVault.color || "#3B82F6" }}
                          >
                            {getProviderIcon(selectedVault.providerType)}
                          </span>
                          <span className="font-medium text-xs text-foreground truncate">
                            {selectedVault.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                            {formatCurrency(selectedVault.balance)}
                          </span>
                        </div>
                      ) : (
                        "Select refund destination"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} side="bottom" align="start">
                    <SelectGroup>
                      {vaults.map((vault) => (
                        <SelectItem key={vault.id} value={vault.id} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span
                              className="flex size-3.5 items-center justify-center rounded text-white shrink-0"
                              style={{ backgroundColor: vault.color || "#3B82F6" }}
                            >
                              {getProviderIcon(vault.providerType)}
                            </span>
                            <span className="font-medium text-xs">{vault.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                              {formatCurrency(vault.balance)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <Alert variant="destructive" className="animate-in fade-in-50">
            <AlertCircleIcon className="size-4 shrink-0" />
            <AlertTitle className="font-semibold">Failed to delete goal</AlertTitle>
            <AlertDescription className="text-xs text-destructive/90">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2 pt-2 sm:justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 cursor-pointer text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="flex-1 gap-1.5 cursor-pointer text-xs font-semibold"
          >
            {isLoading && <Loader2Icon className="size-3.5 animate-spin" />}
            {hasSavings ? "Refund & Delete" : "Delete Goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

