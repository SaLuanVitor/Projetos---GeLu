import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSession,
  loadSession,
  saveSession,
  type StoredSession,
  updateSessionTokens
} from "@/services/session";

const user = {
  id: "user-id",
  name: "Luan",
  email: "luan@example.com",
  active: true
};

describe("session service", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.stubGlobal("window", {
      localStorage: createLocalStorageMock()
    });
  });

  it("saves a session after login", () => {
    const session = saveSession({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
      expiresIn: 900,
      user
    });

    expect(session).toMatchObject({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
      expiresIn: 900,
      user
    });
    expect(loadSession()).toEqual(session);
  });

  it("updates tokens after refresh", () => {
    const current = saveSession({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
      expiresIn: 900,
      user
    });

    const updated = updateSessionTokens(current, {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      tokenType: "Bearer",
      expiresIn: 1800
    });

    expect(updated).toMatchObject({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      tokenType: "Bearer",
      expiresIn: 1800,
      user
    });
    expect(loadSession()).toEqual(updated);
  });

  it("loads a valid stored session", () => {
    const storedSession: StoredSession = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
      expiresIn: 900,
      user,
      updatedAt: "2026-05-10T00:00:00.000Z"
    };
    window.localStorage.setItem("gelu-menu-session", JSON.stringify(storedSession));

    expect(loadSession()).toEqual(storedSession);
  });

  it("clears a stored session", () => {
    saveSession({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
      expiresIn: 900,
      user
    });

    clearSession();

    expect(loadSession()).toBeNull();
  });

  it("discards corrupted session data", () => {
    window.localStorage.setItem("gelu-menu-session", "{invalid-json");

    expect(loadSession()).toBeNull();
    expect(window.localStorage.getItem("gelu-menu-session")).toBeNull();
  });
});

function createLocalStorageMock(): Storage {
  const storage = new Map<string, string>();

  return {
    get length() {
      return storage.size;
    },
    clear: vi.fn(() => storage.clear()),
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(storage.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => storage.delete(key)),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value))
  };
}
