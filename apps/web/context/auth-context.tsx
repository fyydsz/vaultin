"use client";

import React, { createContext, useContext, useCallback, useEffect } from "react";
import { authClient, signIn, signUp, signOut } from "@/lib/auth-client";
import { api, emitBackendError } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  username?: string;
  image?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LoginInput {
  identifier: string;
  password: string;
}

interface RegisterInput {
  name: string;
  email: string;
  username: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  sendVerificationEmail: (targetEmail?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    data: session,
    isPending: isLoading,
    error: sessionError,
    refetch,
  } = authClient.useSession();

  useEffect(() => {
    if (sessionError) {
      const rawMsg =
        typeof sessionError === "object" && sessionError !== null && "message" in sessionError
          ? String((sessionError as { message?: unknown }).message || "")
          : String(sessionError || "");

      const isBackendError =
        !rawMsg ||
        rawMsg.toLowerCase().includes("fetch") ||
        rawMsg.toLowerCase().includes("network") ||
        rawMsg.toLowerCase().includes("connect") ||
        rawMsg.toLowerCase().includes("backend") ||
        rawMsg.toLowerCase().includes("load failed") ||
        rawMsg.toLowerCase().includes("500") ||
        rawMsg.toLowerCase().includes("502") ||
        rawMsg.toLowerCase().includes("503") ||
        rawMsg.toLowerCase().includes("504");

      if (isBackendError) {
        emitBackendError({
          message: "Please check your connection and try again.",
          isBackendDown: true,
          isSessionCheck: true,
          source: "session",
        });
      }
    }
  }, [sessionError]);

  // Throttled refetch (limits get-session calls to maximum 1 every 3 seconds)
  const lastRefetchRef = React.useRef<number>(0);

  const throttledRefetch = useCallback(() => {
    const now = Date.now();
    if (now - lastRefetchRef.current < 3000) return;
    lastRefetchRef.current = now;
    void refetch();
  }, [refetch]);

  // Realtime Cross-tab and Window Focus Sync (only triggers when unverified or on explicit broadcast)
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("vaultin_auth_sync");
      bc.onmessage = (event) => {
        if (event.data?.type === "EMAIL_VERIFIED" || event.data?.type === "AUTH_REFRESH") {
          throttledRefetch();
        }
      };
    } catch {
      // BroadcastChannel fallback to storage event
      const handleStorage = (e: StorageEvent) => {
        if (e.key === "vaultin_auth_sync") {
          throttledRefetch();
        }
      };
      window.addEventListener("storage", handleStorage);
    }

    // Only refetch on focus IF the user is logged in AND currently unverified
    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        session?.user &&
        !session.user.emailVerified
      ) {
        throttledRefetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (bc) bc.close();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [throttledRefetch, session?.user]);

  const user: User | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        emailVerified: Boolean(session.user.emailVerified),
        username:
          "username" in session.user && typeof session.user.username === "string"
            ? session.user.username
            : undefined,
        image: session.user.image ?? undefined,
        createdAt: session.user.createdAt
          ? new Date(session.user.createdAt)
          : undefined,
        updatedAt: session.user.updatedAt
          ? new Date(session.user.updatedAt)
          : undefined,
      }
    : null;

  const login = useCallback(
    async (data: LoginInput) => {
      const identifier = data.identifier.trim();
      const isEmail = identifier.includes("@");

      let result: { error?: { message?: string } | null } | null = null;

      if (isEmail) {
        result = await signIn.email({
          email: identifier,
          password: data.password,
        });
      } else {
        const usernameSignIn = signIn as unknown as {
          username: (params: {
            username: string;
            password: string;
          }) => Promise<{ error?: { message?: string } | null }>;
        };
        result = await usernameSignIn.username({
          username: identifier,
          password: data.password,
        });
      }

      if (result?.error) {
        throw new Error(
          result.error.message || "Invalid email/username or password"
        );
      }
    },
    []
  );

  const register = useCallback(
    async (data: RegisterInput) => {
      const result = await signUp.email({
        email: data.email.toLowerCase().trim(),
        password: data.password,
        name: data.name.trim(),
        username: data.username.toLowerCase().trim(),
      });

      if (result?.error) {
        throw new Error(
          result.error.message || "Registration failed. Please try again."
        );
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          // Session will be cleared from DB by better-auth
          // useSession will automatically reflect the change
        },
      },
    });
  }, []);

  const refreshUser = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const sendVerificationEmail = useCallback(
    async (targetEmail?: string) => {
      const emailToSend = targetEmail || user?.email;
      if (!emailToSend) {
        throw new Error("No email address available to send verification to.");
      }

      // Try server endpoint first for currently authenticated user
      try {
        await api.sendVerificationEmail();
        return;
      } catch {
        // Fallback to Better Auth client
      }

      const frontendOrigin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      const result = await authClient.sendVerificationEmail({
        email: emailToSend,
        callbackURL: `${frontendOrigin}/verify-email?status=success`,
      });

      if (result?.error) {
        throw new Error(
          result.error.message || "Failed to send verification email. Please try again."
        );
      }
    },
    [user?.email]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        sendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
