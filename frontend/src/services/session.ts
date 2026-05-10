import type { AuthTokenResponse, AuthUser, RefreshTokenResponse } from "@/types/api";

const SESSION_KEY = "gelu-menu-session";

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
  updatedAt: string;
};

export function saveSession(auth: AuthTokenResponse): StoredSession {
  const session: StoredSession = {
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    tokenType: auth.tokenType,
    expiresIn: auth.expiresIn,
    user: auth.user,
    updatedAt: new Date().toISOString()
  };

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function updateSessionTokens(
  current: StoredSession,
  tokens: RefreshTokenResponse
): StoredSession {
  const session: StoredSession = {
    ...current,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenType: tokens.tokenType,
    expiresIn: tokens.expiresIn,
    updatedAt: new Date().toISOString()
  };

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function loadSession(): StoredSession | null {
  const rawSession = window.localStorage.getItem(SESSION_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as StoredSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}
