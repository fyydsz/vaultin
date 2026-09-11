"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCardIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
  RefreshCwIcon,
  AlertCircleIcon,
} from "lucide-react";
import { VaultCard } from "@/components/vault-card";
import { VaultDialog } from "@/components/vault-dialog";
import { UpdateBalanceDialog } from "@/components/update-balance-dialog";
import { DeleteVaultDialog } from "@/components/delete-vault-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
} from "@/components/ui/alert";
import { BankVault, VaultSummary, api } from "@/lib/api";

function VaultsContent() {
  const searchParams = useSearchParams();
  const [vaults, setVaults] = useState<BankVault[]>([]);
  const [summary, setSummary] = useState<VaultSummary>({
    totalBalance: 0,
    count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Modal dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [vaultToEdit, setVaultToEdit] = useState<BankVault | null>(null);
  const [vaultToUpdateBalance, setVaultToUpdateBalance] =
    useState<BankVault | null>(null);
  const [vaultToDelete, setVaultToDelete] = useState<BankVault | null>(
    null
  );

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new" || action === "add" || action === "create") {
      setVaultToEdit(null);
      setIsAddOpen(true);
    }
  }, [searchParams]);

  const fetchVaults = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await api.getVaults();
      setVaults(data.vaults || []);
      setSummary(
        data.summary || {
          totalBalance: 0,
          count: data.vaults?.length || 0,
        }
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again later.";
      setFetchError(message);
      console.error("Failed to fetch vaults:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchVaults();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchVaults]);

  const handleVaultSaved = () => {
    void fetchVaults();
  };

  const handleVaultDeleted = (deletedId: string) => {
    setVaults((prev) => prev.filter((a) => a.id !== deletedId));
    fetchVaults();
  };

  const filteredVaults = useMemo(() => {
    return vaults.filter((acc) => {
      const matchesSearch =
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.accountType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        filterType === "ALL" || acc.providerType === filterType;

      return matchesSearch && matchesType;
    });
  }, [vaults, searchQuery, filterType]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Top Header matching Transactions Page */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <CreditCardIcon className="size-6 text-primary" />
            Vaults
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your bank accounts, digital e-wallets, and cash pockets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchVaults}
            disabled={isLoading}
            className="gap-1.5 text-xs cursor-pointer h-9"
          >
            <RefreshCwIcon
              className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setVaultToEdit(null);
              setIsAddOpen(true);
            }}
            className="gap-1.5 text-xs font-semibold cursor-pointer h-9"
          >
            <PlusIcon className="size-4" />
            New Vault
          </Button>
        </div>
      </div>

      {fetchError && (
        <Alert variant="destructive" className="animate-in fade-in-50">
          <AlertCircleIcon className="size-4 shrink-0" />
          <AlertTitle className="font-semibold">Failed to load vaults</AlertTitle>
          <AlertDescription className="text-xs text-destructive/90">
            {fetchError}
          </AlertDescription>
          <AlertAction>
            <Button
              size="xs"
              variant="outline"
              onClick={fetchVaults}
              disabled={isLoading}
              className="h-7 px-2 text-xs border-destructive/30 hover:bg-destructive/10 cursor-pointer"
            >
              <RefreshCwIcon className={`size-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Retry
            </Button>
          </AlertAction>
        </Alert>
      )}

      {/* Toolbar: Search, Filters, & Refresh */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search vault name, provider, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs bg-card/60 border-border/80 focus-visible:ring-1"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Clear search"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { value: "ALL", label: "All" },
            { value: "BANK", label: "Bank" },
            { value: "E_WALLET", label: "E-Wallet" },
            { value: "CASH", label: "Cash" },
            { value: "OTHER", label: "Other" },
          ].map((tab) => (
            <Button
              key={tab.value}
              type="button"
              size="sm"
              variant={filterType === tab.value ? "default" : "outline"}
              onClick={() => setFilterType(tab.value)}
              className={`rounded-full px-3.5 h-8 text-xs font-medium transition-colors cursor-pointer ${
                filterType === tab.value
                  ? "border-primary bg-primary text-primary-foreground shadow-2xs font-semibold"
                  : "border-border bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Account Cards Grid or Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border bg-card p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="size-7 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-28 w-full rounded-lg" />
              <div className="flex justify-between pt-1">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredVaults.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filteredVaults.map((vault) => (
            <VaultCard
              key={vault.id}
              vault={vault}
              onUpdateBalance={(v) => setVaultToUpdateBalance(v)}
              onEdit={(v) => {
                setVaultToEdit(v);
                setIsAddOpen(true);
              }}
              onSetDefault={async (v) => {
                if (v.isDefault) return;
                try {
                  await api.updateVault(v.id, { isDefault: true });
                  await fetchVaults();
                } catch (err) {
                  console.error("Failed to set vault as default:", err);
                }
              }}
              onDelete={(v) => setVaultToDelete(v)}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/30 p-8 text-center animate-in fade-in-50">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3 shadow-xs">
            <CreditCardIcon className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {searchQuery || filterType !== "ALL"
              ? "No matching vaults found"
              : "No Vaults Added Yet"}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {searchQuery || filterType !== "ALL"
              ? "Try adjusting your search query or reset the account type filter."
              : "Add your first bank account, digital e-wallet, or cash pocket to start organizing your personal finances."}
          </p>
          {!searchQuery && filterType === "ALL" && (
            <Button
              size="sm"
              onClick={() => {
                setVaultToEdit(null);
                setIsAddOpen(true);
              }}
              className="mt-4 gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <PlusIcon className="size-4" />
              Add Your First Vault
            </Button>
          )}
        </div>
      )}

      {/* Add / Edit Account Dialog */}
      <VaultDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        vaultToEdit={vaultToEdit}
        existingVaultCount={vaults.length}
        onSuccess={handleVaultSaved}
      />

      {/* Quick Update Balance Dialog */}
      <UpdateBalanceDialog
        open={!!vaultToUpdateBalance}
        onOpenChange={(open) => {
          if (!open) setVaultToUpdateBalance(null);
        }}
        vault={vaultToUpdateBalance}
        onSuccess={handleVaultSaved}
      />

      {/* Delete Account Confirmation Dialog */}
      <DeleteVaultDialog
        open={!!vaultToDelete}
        onOpenChange={(open) => {
          if (!open) setVaultToDelete(null);
        }}
        vault={vaultToDelete}
        onSuccess={handleVaultDeleted}
      />
    </div>
  );
}

export default function VaultsPage() {
  return (
    <Suspense fallback={null}>
      <VaultsContent />
    </Suspense>
  );
}

