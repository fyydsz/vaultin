"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2Icon,
  AlertTriangleIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { toast } from "sonner";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
}: DeleteAccountDialogProps) {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await api.deleteAccount(password);
      toast.success("Your account has been deleted.");
      await logout().catch(() => {});
      router.push("/signup");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to delete account. Please check your password and try again.";
      setError(msg);
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!isDeleting) {
          setPassword("");
          setError(null);
          setShowPassword(false);
          onOpenChange(val);
        }
      }}
    >
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="gap-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-1">
            <AlertTriangleIcon className="size-5" />
          </div>
          <DialogTitle className="text-base font-bold text-foreground">
            Permanently Delete Account
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            This action is irreversible. All of your bank accounts, transactions,
            budgets, savings goals, labels, and personal data for{" "}
            <span className="font-semibold text-foreground">{user?.email}</span>{" "}
            will be permanently removed from Vaultin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleDelete} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              To confirm, please enter your password:
            </label>
            <div className="relative flex items-center">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••••••"
                className="h-9 text-sm pr-9"
                disabled={isDeleting}
                autoFocus
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1.5 size-7 text-muted-foreground hover:text-foreground hover:bg-transparent"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={!password || isDeleting}
              className="gap-1.5 text-xs font-semibold"
            >
              {isDeleting && <Loader2Icon className="size-3 animate-spin" />}
              Permanently Delete Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
