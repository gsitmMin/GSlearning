"use client";
/**
 * 백엔드 API 클라이언트 — 토큰 부착·자동 refresh·401 처리 단일 창구.
 * 모든 화면은 fetch 대신 이 모듈을 사용한다.
 */

export type UserView = {
  accountId: number;
  employeeNo: string;
  name: string;
  email: string;
  organization: string;
  position: string | null;
  roles: string[];
  mustChangePassword: boolean;
};

type Envelope<T> = {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
};

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

const AT = "gsl.accessToken";
const RT = "gsl.refreshToken";
const US = "gsl.user";

export function getUser(): UserView | null {
  try {
    const raw = localStorage.getItem(US);
    return raw ? (JSON.parse(raw) as UserView) : null;
  } catch {
    return null;
  }
}

export function hasSession(): boolean {
  try {
    return !!localStorage.getItem(AT);
  } catch {
    return false;
  }
}

function saveSession(d: { accessToken: string; refreshToken: string; user: UserView }) {
  localStorage.setItem(AT, d.accessToken);
  localStorage.setItem(RT, d.refreshToken);
  localStorage.setItem(US, JSON.stringify(d.user));
}

export function clearSession() {
  localStorage.removeItem(AT);
  localStorage.removeItem(RT);
  localStorage.removeItem(US);
}

async function raw<T>(path: string, init?: RequestInit): Promise<Envelope<T>> {
  const token = localStorage.getItem(AT);
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!json) throw new ApiError("PARSE", "응답을 읽을 수 없습니다.", res.status);
  if (!res.ok || !json.success) {
    throw new ApiError(json.error?.code ?? "HTTP", json.error?.message ?? `오류 (${res.status})`, res.status);
  }
  return json;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem(RT);
  if (!refreshToken) return false;
  try {
    const j = await raw<{ accessToken: string; refreshToken: string; user: UserView }>(
      "/auth/refresh",
      { method: "POST", body: JSON.stringify({ refreshToken }) }
    );
    saveSession(j.data);
    return true;
  } catch {
    return false;
  }
}

/** 로그인 화면으로 보내고, 영원히 pending인 Promise를 반환 (페이지는 곧 언마운트) */
function redirectToLogin<T>(): Promise<T> {
  clearSession();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
  return new Promise<T>(() => {});
}

/** 인증 포함 API 호출. 401이면 refresh 1회 재시도 후 로그인으로 보낸다. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!hasSession() && !path.startsWith("/auth/")) return redirectToLogin<T>();
  try {
    return (await raw<T>(path, init)).data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401 && !path.startsWith("/auth/")) {
      if (await tryRefresh()) return (await raw<T>(path, init)).data;
      return redirectToLogin<T>();
    }
    throw e;
  }
}

export async function login(email: string, password: string): Promise<UserView> {
  const j = await raw<{ accessToken: string; refreshToken: string; user: UserView }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
  saveSession(j.data);
  return j.data.user;
}

export async function logout() {
  const refreshToken = localStorage.getItem(RT);
  if (refreshToken) {
    await raw("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }).catch(() => {});
  }
  clearSession();
  window.location.href = "/login";
}
