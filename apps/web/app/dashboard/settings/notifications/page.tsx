"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2Icon, CheckIcon, BellIcon } from "lucide-react";
import { toast } from "sonner";

interface NotificationPreferences {
  emailDigest: boolean;
  budgetAlerts: boolean;
  goalReminders: boolean;
  transactionAlerts: boolean;
  securityAlerts: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  emailDigest: true,
  budgetAlerts: true,
  goalReminders: true,
  transactionAlerts: false,
  securityAlerts: true,
};

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vaultin_notification_prefs");
      if (stored) {
        try {
          setPrefs(JSON.parse(stored));
        } catch {}
      }
    }
  }, []);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("vaultin_notification_prefs", JSON.stringify(prefs));
      }
      setSaveSuccess(true);
      toast.success("Notification preferences saved");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Notification settings
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage how you receive alerts and updates
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 pt-2">
        <div className="space-y-4 divide-y divide-border/40">
          {/* Budget Alerts */}
          <div className="flex items-start justify-between gap-4 pt-4 first:pt-0">
            <div className="space-y-0.5">
              <label
                htmlFor="budgetAlerts"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Budget alerts
              </label>
              <p className="text-xs text-muted-foreground">
                Get notified when your spending exceeds 80% or 100% of your monthly budget.
              </p>
            </div>
            <Checkbox
              id="budgetAlerts"
              checked={prefs.budgetAlerts}
              onCheckedChange={() => handleToggle("budgetAlerts")}
            />
          </div>

          {/* Goal Reminders */}
          <div className="flex items-start justify-between gap-4 pt-4">
            <div className="space-y-0.5">
              <label
                htmlFor="goalReminders"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Savings goal reminders
              </label>
              <p className="text-xs text-muted-foreground">
                Receive periodic reminders to contribute towards your active savings targets.
              </p>
            </div>
            <Checkbox
              id="goalReminders"
              checked={prefs.goalReminders}
              onCheckedChange={() => handleToggle("goalReminders")}
            />
          </div>

          {/* Email Digest */}
          <div className="flex items-start justify-between gap-4 pt-4">
            <div className="space-y-0.5">
              <label
                htmlFor="emailDigest"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Weekly email digest
              </label>
              <p className="text-xs text-muted-foreground">
                A weekly breakdown of your income, expenses, and net cashflow delivered to your email.
              </p>
            </div>
            <Checkbox
              id="emailDigest"
              checked={prefs.emailDigest}
              onCheckedChange={() => handleToggle("emailDigest")}
            />
          </div>

          {/* Transaction Activity Alerts */}
          <div className="flex items-start justify-between gap-4 pt-4">
            <div className="space-y-0.5">
              <label
                htmlFor="transactionAlerts"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Large transaction notifications
              </label>
              <p className="text-xs text-muted-foreground">
                Get instant notifications for high-value transactions or unusual spending.
              </p>
            </div>
            <Checkbox
              id="transactionAlerts"
              checked={prefs.transactionAlerts}
              onCheckedChange={() => handleToggle("transactionAlerts")}
            />
          </div>

          {/* Security Alerts */}
          <div className="flex items-start justify-between gap-4 pt-4">
            <div className="space-y-0.5">
              <label
                htmlFor="securityAlerts"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Security & account alerts
              </label>
              <p className="text-xs text-muted-foreground">
                Important notifications regarding new device logins, password resets, and verification.
              </p>
            </div>
            <Checkbox
              id="securityAlerts"
              checked={prefs.securityAlerts}
              onCheckedChange={() => handleToggle("securityAlerts")}
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="px-5 font-semibold text-xs h-8"
          >
            {isSaving && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
            {saveSuccess && <CheckIcon className="mr-1.5 size-3.5 text-emerald-400" />}
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
