import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";
import { getApiBaseUrl } from "./api";

const getAuthBaseUrl = (): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl.replace(/\/$/, "")}/auth`;
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
  fetchOptions: {
    credentials: "include",
  },
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
  plugins: [
    usernameClient(),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
