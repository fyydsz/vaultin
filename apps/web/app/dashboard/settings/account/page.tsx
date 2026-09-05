"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { validateEmail } from "@/lib/validation";
import { uploadAvatar, deleteAvatarFromStorage } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { AvatarCropperDialog } from "@/components/avatar-cropper-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2Icon,
  CheckIcon,
  CheckCircle2Icon,
  XCircleIcon,
  CameraIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "id", label: "Bahasa Indonesia" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
];

const COOLDOWN_SECONDS = 60;
const STORAGE_KEY = "vaultin_email_resend_cooldown";

export default function AccountSettingsPage() {
  const { user, refreshUser, sendVerificationEmail } = useAuth();

  // Profile Picture Upload & Cropper State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Information State
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState("en");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Email verification resend state
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Restore cooldown from localStorage
  useEffect(() => {
    try {
      const storedTime = localStorage.getItem(STORAGE_KEY);
      if (storedTime) {
        const remaining = Math.max(
          0,
          Math.ceil((parseInt(storedTime, 10) - Date.now()) / 1000)
        );
        if (remaining > 0) {
          setCooldown(remaining);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {}
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  // Initial loaded values to detect changes
  const [initialProfile, setInitialProfile] = useState<{
    name: string;
    username: string;
    email: string;
    language: string;
  } | null>(null);

  // Debounced Username Availability Check
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState<{
    available: boolean;
    isCurrent?: boolean;
    message?: string;
    reason?: string;
  } | null>(null);

  // Update Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const getInitials = (displayName: string) => {
    if (!displayName) return "U";
    return displayName
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WebP, or GIF).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file is too large (maximum 10MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageForCrop(reader.result?.toString() || null);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input value so user can select the same file again if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCroppedSave = async (croppedFile: File) => {
    if (!user) return;

    const oldImageUrl = user.image;
    setIsUploadingAvatar(true);
    try {
      // 1. Upload cropped image to Supabase Storage
      const { publicUrl } = await uploadAvatar(croppedFile, user.id);

      // 2. Update user profile with the new image URL in backend
      await api.updateProfile({ image: publicUrl });

      // 3. Also sync with Better Auth client if available
      try {
        await authClient.updateUser({ image: publicUrl });
      } catch {}

      // 4. Delete old avatar from storage if exists and different
      if (oldImageUrl && oldImageUrl !== publicUrl) {
        await deleteAvatarFromStorage(oldImageUrl);
      }

      // 5. Refresh user session state
      await refreshUser();
      toast.success("Profile photo updated successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload profile photo";
      toast.error(msg);
      throw err;
    } finally {
      setIsUploadingAvatar(false);
      setSelectedImageForCrop(null);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || isDeletingAvatar) return;

    setIsDeletingAvatar(true);
    try {
      // 1. Delete image from Supabase Storage if it was uploaded
      if (user.image) {
        await deleteAvatarFromStorage(user.image);
      }

      // 2. Clear image in database
      await api.updateProfile({ image: "" });

      // 3. Also sync with Better Auth client if available
      try {
        await authClient.updateUser({ image: "" });
      } catch {}

      // 4. Refresh user session state
      await refreshUser();
      toast.success("Profile photo removed successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove profile photo";
      toast.error(msg);
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const handleResendVerification = async () => {
    if (isSendingVerification || cooldown > 0) return;
    setIsSendingVerification(true);
    try {
      await sendVerificationEmail(email || user?.email);
      toast.success("Verification email sent!", {
        description: `Please check your inbox or spam folder at ${email || user?.email}.`,
      });
      const targetTime = Date.now() + COOLDOWN_SECONDS * 1000;
      try {
        localStorage.setItem(STORAGE_KEY, targetTime.toString());
      } catch {}
      setCooldown(COOLDOWN_SECONDS);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send verification email";
      toast.error(msg);
    } finally {
      setIsSendingVerification(false);
    }
  };

  useEffect(() => {
    if (user) {
      const currentName = user.name || "";
      const currentUsername = user.username || "";
      const currentEmail = user.email || "";
      let currentLanguage = "en";

      if (typeof window !== "undefined") {
        const savedLanguage = localStorage.getItem("vaultin_pref_language");
        if (savedLanguage) currentLanguage = savedLanguage;
      }

      setName(currentName);
      setUsername(currentUsername);
      setEmail(currentEmail);
      setLanguage(currentLanguage);

      setInitialProfile({
        name: currentName,
        username: currentUsername,
        email: currentEmail,
        language: currentLanguage,
      });
    }
  }, [user]);

  // Debounced Username Availability Checking (400ms delay)
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      setUsernameAvailability(null);
      setIsCheckingUsername(false);
      return;
    }

    if (user?.username && trimmed === user.username.toLowerCase()) {
      setUsernameAvailability({
        available: true,
        isCurrent: true,
        message: "This is your current username",
      });
      setIsCheckingUsername(false);
      return;
    }

    if (trimmed.length < 3) {
      setUsernameAvailability({
        available: false,
        reason: "Username must be at least 3 characters",
      });
      setIsCheckingUsername(false);
      return;
    }

    if (!/^[a-z0-9_.]+$/.test(trimmed)) {
      setUsernameAvailability({
        available: false,
        reason: "Only lowercase letters, numbers, underscores, and dots are allowed",
      });
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.checkUsername(trimmed);
        setUsernameAvailability(res);
      } catch {
        setUsernameAvailability(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, user?.username]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    const trimmedName = name.trim();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setProfileError("Name cannot be empty");
      return;
    }

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setProfileError("Name must be between 2 and 50 characters");
      return;
    }

    if (!trimmedUsername) {
      setProfileError("Username cannot be empty");
      return;
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      setProfileError("Username must be between 3 and 30 characters");
      return;
    }

    if (usernameAvailability && !usernameAvailability.available) {
      setProfileError(usernameAvailability.reason || "Username is not available");
      return;
    }

    if (!trimmedEmail) {
      setProfileError("Email cannot be empty");
      return;
    }

    if (!validateEmail(trimmedEmail) || trimmedEmail.length > 100) {
      setProfileError("Please enter a valid email address");
      return;
    }

    setIsSavingProfile(true);
    setProfileSuccess(false);

    try {
      const isEmailChanged = trimmedEmail !== initialProfile?.email;

      // 1. Update through API (updates name, username, and email in database)
      const updateRes = await api.updateProfile({
        name: trimmedName,
        username: trimmedUsername,
        email: trimmedEmail,
      });

      // If email was changed, trigger cooldown and notify banner
      if (isEmailChanged) {
        const targetTime = Date.now() + COOLDOWN_SECONDS * 1000;
        try {
          localStorage.setItem(STORAGE_KEY, targetTime.toString());
        } catch {}
        setCooldown(COOLDOWN_SECONDS);
        window.dispatchEvent(new CustomEvent("vaultin_email_sent"));
      }

      // 2. Also sync with Better Auth client if available
      try {
        await authClient.updateUser({ name: trimmedName });
      } catch {}

      // 3. Save language preference to local storage
      if (typeof window !== "undefined") {
        localStorage.setItem("vaultin_pref_language", language);
      }

      setInitialProfile({
        name: trimmedName,
        username: trimmedUsername,
        email: trimmedEmail,
        language,
      });

      await refreshUser();
      setProfileSuccess(true);
      toast.success(
        isEmailChanged
          ? "Profile updated! Verification link sent to your new email."
          : "Profile information updated successfully"
      );
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      setProfileError(msg);
      toast.error(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }
    if (!newPassword) {
      setPasswordError("New password is required");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (res?.error) {
        throw new Error(res.error.message || "Failed to update password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password";
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const hasProfileChanges = initialProfile
    ? name.trim() !== initialProfile.name.trim() ||
      username.trim().toLowerCase() !== initialProfile.username.trim().toLowerCase() ||
      email.trim().toLowerCase() !== initialProfile.email.trim().toLowerCase() ||
      language !== initialProfile.language
    : false;

  const isSaveDisabled =
    isSavingProfile ||
    isCheckingUsername ||
    !hasProfileChanges ||
    !name.trim() ||
    !username.trim() ||
    !email.trim() ||
    (usernameAvailability !== null && !usernameAvailability.available);

  return (
    <div className="space-y-10 max-w-2xl">
      {/* Profile Photo Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Profile photo
          </h2>
          <p className="text-xs text-muted-foreground">
            This photo will be displayed on your profile and across Vaultin.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl border border-border/70 bg-card/40">
          {/* Avatar with loading overlay */}
          <div className="relative group shrink-0">
            <Avatar className="size-20 border-2 border-border shadow-xs">
              <AvatarImage
                src={user?.image || undefined}
                alt={user?.name || "Profile photo"}
                className="object-cover"
              />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {getInitials(name || user?.name || "U")}
              </AvatarFallback>
            </Avatar>

            {/* Spinner overlay when uploading/deleting */}
            {(isUploadingAvatar || isDeletingAvatar) && (
              <div className="absolute inset-0 rounded-full bg-background/80 backdrop-blur-xs flex items-center justify-center">
                <Loader2Icon className="size-5 animate-spin text-primary" />
              </div>
            )}
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleAvatarFileChange}
                className="hidden"
                id="avatar-upload-input"
                disabled={isUploadingAvatar || isDeletingAvatar}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar || isDeletingAvatar}
                className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                {isUploadingAvatar ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <CameraIcon className="size-3.5 text-muted-foreground" />
                )}
                {user?.image ? "Change Photo" : "Upload Photo"}
              </Button>

              {user?.image && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar || isDeletingAvatar}
                  className="h-8 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 cursor-pointer"
                >
                  {isDeletingAvatar ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2Icon className="size-3.5" />
                  )}
                  Remove
                </Button>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              JPG, PNG, WebP, or GIF. Maximum file size 5MB.
            </p>
          </div>
        </div>
      </section>

      <div className="border-t border-border/40" />

      {/* Profile information Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Profile information
          </h2>
          <p className="text-xs text-muted-foreground">
            Update your name, username, and email address
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {profileError && (
            <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive border border-destructive/20">
              {profileError}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (profileError) setProfileError(null);
              }}
              placeholder="Your full name"
              className="h-9 text-sm"
              maxLength={50}
              disabled={isSavingProfile}
            />
          </div>

          {/* Username (with debounced availability check) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Username
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-xs font-medium text-muted-foreground select-none">
                @
              </span>
              <Input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase());
                  if (profileError) setProfileError(null);
                }}
                placeholder="username"
                className="pl-6 pr-8 h-9 text-sm font-mono lowercase"
                disabled={isSavingProfile}
                maxLength={30}
              />
              <div className="absolute right-2.5 flex items-center">
                {isCheckingUsername && (
                  <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
                )}
                {!isCheckingUsername && usernameAvailability && (
                  usernameAvailability.available ? (
                    <CheckCircle2Icon
                      className={`size-3.5 ${
                        usernameAvailability.isCurrent
                          ? "text-muted-foreground"
                          : "text-emerald-500"
                      }`}
                    />
                  ) : (
                    <XCircleIcon className="size-3.5 text-destructive" />
                  )
                )}
              </div>
            </div>

            {/* Helper status text */}
            {isCheckingUsername ? (
              <p className="text-[11px] text-muted-foreground animate-pulse">
                Checking username availability...
              </p>
            ) : usernameAvailability ? (
              usernameAvailability.available ? (
                <p
                  className={`text-[11px] font-medium ${
                    usernameAvailability.isCurrent
                      ? "text-muted-foreground"
                      : "text-emerald-500"
                  }`}
                >
                  {usernameAvailability.isCurrent
                    ? "This is your current username"
                    : "✓ Username is available"}
                </p>
              ) : (
                <p className="text-[11px] text-destructive font-medium">
                  {usernameAvailability.reason || "Username is already taken"}
                </p>
              )
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Your unique handle used by friends to find you.
              </p>
            )}
          </div>

          {/* Email address */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Email address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (profileError) setProfileError(null);
              }}
              placeholder="name@example.com"
              className="h-9 text-sm"
              maxLength={100}
              disabled={isSavingProfile}
            />
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Language
            </label>
            <Select value={language} onValueChange={(val) => val && setLanguage(val)}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select language">
                  {LANGUAGES.find((l) => l.value === language)?.label || "Select language"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value} className="text-sm">
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unverified email notice */}
          {!user?.emailVerified && (
            <div className="text-xs text-muted-foreground pt-1">
              Your email address is unverified.{" "}
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isSendingVerification || cooldown > 0}
                className="font-medium text-foreground underline hover:text-primary transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSendingVerification
                  ? "Sending..."
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Click here to resend the verification email."}
              </button>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              size="default"
              disabled={isSaveDisabled}
              className="px-5 font-semibold text-xs h-8"
            >
              {isSavingProfile && (
                <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
              )}
              {profileSuccess && (
                <CheckIcon className="mr-1.5 size-3.5 text-emerald-400" />
              )}
              Save
            </Button>
          </div>
        </form>
      </section>

      <div className="border-t border-border/40" />

      {/* Update password Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Update password
          </h2>
          <p className="text-xs text-muted-foreground">
            Ensure your account is using a long, random password to stay secure.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {passwordError && (
            <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive border border-destructive/20">
              {passwordError}
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Current Password
            </label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              placeholder="••••••••"
              className="h-9 text-sm"
              disabled={isUpdatingPassword}
            />
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              New Password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              placeholder="••••••••"
              className="h-9 text-sm"
              disabled={isUpdatingPassword}
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Confirm Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              placeholder="••••••••"
              className="h-9 text-sm"
              disabled={isUpdatingPassword}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              size="default"
              disabled={
                isUpdatingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              className="px-5 font-semibold text-xs h-8"
            >
              {isUpdatingPassword && (
                <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
              )}
              Save
            </Button>
          </div>
        </form>
      </section>

      {/* Avatar Cropper Dialog */}
      <AvatarCropperDialog
        open={isCropperOpen}
        onOpenChange={setIsCropperOpen}
        imageSrc={selectedImageForCrop}
        onCropSave={handleCroppedSave}
      />
    </div>
  );
}
