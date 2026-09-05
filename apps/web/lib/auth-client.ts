import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";
import { getApiBaseUrl } from "./api";

const getAuthBaseUrl = (): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl.replace(/\/$/, "")}/api/auth`;
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
  fetchOptions: {
    credentials: "include",
    onError(ctx) {
      if (ctx.response?.status === 401 && typeof window !== "undefined") {
        if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/signup")) {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.replace("/login");
        }
      }
    },
  },
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
  plugins: [
    usernameClient(),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
