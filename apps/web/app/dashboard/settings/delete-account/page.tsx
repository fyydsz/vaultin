"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, Trash2Icon } from "lucide-react";

export default function DeleteAccountSettingsPage() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-destructive">
          Delete Account
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Permanently remove your account and all associated data
        </p>
      </div>

      {/* Danger Zone Container */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/15 text-destructive shrink-0">
            <AlertTriangleIcon className="size-4.5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              Warning: This action is permanent and cannot be undone
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Deleting your account will immediately remove all your personal data,
              including connected bank accounts, transaction history, categories,
              labels, active budgets, and savings goals registered under{" "}
              <span className="font-semibold text-foreground">{user?.email}</span>.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-destructive/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            No recovery is possible after confirmation.
          </span>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="gap-1.5 font-semibold text-xs h-8"
          >
            <Trash2Icon className="size-3.5" />
            Delete Account
          </Button>
        </div>
      </div>

      <DeleteAccountDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
