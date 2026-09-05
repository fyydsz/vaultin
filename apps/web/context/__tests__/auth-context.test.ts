import { expect, describe, it } from "bun:test";

describe("Auth Context - Better Auth Integration", () => {
  it("should export useAuth hook", async () => {
    const mod = await import("@/context/auth-context");
    expect(mod.useAuth).toBeDefined();
    expect(typeof mod.useAuth).toBe("function");
  });

  it("should export AuthProvider component", async () => {
    const mod = await import("@/context/auth-context");
    expect(mod.AuthProvider).toBeDefined();
    expect(typeof mod.AuthProvider).toBe("function");
  });

  it("should export authClient with session methods", async () => {
    const mod = await import("@/lib/auth-client");
    expect(mod.authClient).toBeDefined();
    expect(mod.signIn).toBeDefined();
    expect(mod.signUp).toBeDefined();
    expect(mod.signOut).toBeDefined();
    expect(mod.authClient.useSession).toBeDefined();
  });
});
