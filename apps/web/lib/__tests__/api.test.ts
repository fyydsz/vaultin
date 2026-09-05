import { expect, describe, it, beforeEach, mock } from "bun:test";
import { api, ApiError } from "../api";

interface CapturedEventDetail {
  isBackendDown?: boolean;
  status?: number;
  message?: string;
}

type EventCallback = (e: CustomEvent<CapturedEventDetail>) => void;

describe("Frontend API Client Unit Tests", () => {
  beforeEach(() => {
    // Reset mock
  });

  it("should fetch user profile successfully", async () => {
    const mockUser = {
      id: "usr-1",
      name: "Test User",
      email: "test@example.com",
      username: "testuser",
    };

    globalThis.fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toContain("/profile");
      expect(init?.method).toBe("GET");
      expect(init?.credentials).toBe("include");

      return new Response(JSON.stringify({ user: mockUser }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const res = await api.getProfile();
    expect(res.user.name).toBe("Test User");
    expect(res.user.email).toBe("test@example.com");
  });

  it("should throw ApiError on 401 unauthorized response", async () => {
    globalThis.fetch = mock(async () => {
      return new Response(
        JSON.stringify({ error: "Unauthorized access, please login first" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }) as unknown as typeof fetch;

    try {
      await api.getProfile();
      expect(true).toBe(false); // Should not reach here
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ApiError);
      if (err instanceof ApiError) {
        expect(err.message).toBe("Unauthorized access, please login first");
        expect(err.status).toBe(401);
      }
    }
  });

  it("should include credentials in all requests for cookie-based auth", async () => {
    globalThis.fetch = mock(async (_url: string | URL | Request, init?: RequestInit) => {
      // Verify credentials: "include" is always set
      expect(init?.credentials).toBe("include");

      return new Response(JSON.stringify({ user: { id: "1", name: "Test", email: "t@t.com" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    await api.getProfile();
  });

  it("should throw ApiError and emit event when backend is offline or fails to connect", async () => {
    const listeners: Record<string, EventCallback[]> = {};
    const mockWindow = {
      addEventListener: (type: string, cb: EventCallback) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(cb);
      },
      removeEventListener: (type: string, cb: EventCallback) => {
        listeners[type] = (listeners[type] || []).filter((f) => f !== cb);
      },
      dispatchEvent: (e: CustomEvent<CapturedEventDetail>) => {
        (listeners[e.type] || []).forEach((cb) => cb(e));
        return true;
      },
    };
    Object.defineProperty(globalThis, "window", {
      value: mockWindow,
      writable: true,
      configurable: true,
    });

    let capturedEvent: CapturedEventDetail | null = null;
    const eventHandler: EventCallback = (e) => {
      capturedEvent = e.detail;
    };
    mockWindow.addEventListener("backend:connection-error", eventHandler);

    globalThis.fetch = mock(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;

    try {
      await api.getProfile();
      expect(true).toBe(false);
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ApiError);
      if (err instanceof ApiError) {
        expect(err.message).toContain("Something went wrong");
        expect(err.status).toBe(0);
      }
    }

    expect(capturedEvent).not.toBeNull();
    expect((capturedEvent as CapturedEventDetail | null)?.isBackendDown).toBe(true);

    mockWindow.removeEventListener("backend:connection-error", eventHandler);
  });

  it("should emit backend:connection-error on 500/502 server error", async () => {
    const listeners: Record<string, EventCallback[]> = {};
    const mockWindow = {
      addEventListener: (type: string, cb: EventCallback) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(cb);
      },
      removeEventListener: (type: string, cb: EventCallback) => {
        listeners[type] = (listeners[type] || []).filter((f) => f !== cb);
      },
      dispatchEvent: (e: CustomEvent<CapturedEventDetail>) => {
        (listeners[e.type] || []).forEach((cb) => cb(e));
        return true;
      },
    };
    Object.defineProperty(globalThis, "window", {
      value: mockWindow,
      writable: true,
      configurable: true,
    });

    let capturedEvent: CapturedEventDetail | null = null;
    const eventHandler: EventCallback = (e) => {
      capturedEvent = e.detail;
    };
    mockWindow.addEventListener("backend:connection-error", eventHandler);

    globalThis.fetch = mock(async () => {
      return new Response(JSON.stringify({ message: "Internal Server Error" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    try {
      await api.getProfile();
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(ApiError);
    }

    expect(capturedEvent).not.toBeNull();
    expect((capturedEvent as CapturedEventDetail | null)?.status).toBe(502);

    mockWindow.removeEventListener("backend:connection-error", eventHandler);
  });

  it("should dynamically resolve LAN IP when accessing from a mobile device or network host", async () => {
    const { getApiBaseUrl } = await import("../api");

    const originalWindow = globalThis.window;
    try {
      Object.defineProperty(globalThis, "window", {
        value: {
          location: {
            hostname: "192.168.1.4",
            origin: "http://192.168.1.4:3000",
          },
        },
        writable: true,
        configurable: true,
      });

      const resolvedUrl = getApiBaseUrl();
      expect(resolvedUrl).toContain("192.168.1.4");
      expect(resolvedUrl).toContain(":8000");
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    }
  });
});
