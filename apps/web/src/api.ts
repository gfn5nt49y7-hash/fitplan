import type { ApiError, ApiSuccess } from "@fitplan/contracts";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const tokenStorageKey = "fitplan_access_token";

export function getAccessToken(): string | null {
  return window.sessionStorage.getItem(tokenStorageKey);
}

export function setAccessToken(token: string): void {
  window.sessionStorage.setItem(tokenStorageKey, token);
}

export function clearAccessToken(): void {
  window.sessionStorage.removeItem(tokenStorageKey);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const accessToken = getAccessToken();
  const response = await fetch(apiBaseUrl + path, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers
    }
  });

  const body = response.status === 204
    ? undefined
    : await response.json().catch(function () {
        return undefined;
      });

  if (!response.ok) {
    const apiError = body as ApiError | undefined;
    throw new Error(apiError?.error?.message ?? "请求失败，请稍后再试");
  }

  return (body as ApiSuccess<T> | undefined)?.data as T;
}

export async function downloadWorkoutExport(): Promise<void> {
  const accessToken = getAccessToken();
  const response = await fetch(apiBaseUrl + "/api/v1/workouts/export", {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
  });
  if (!response.ok) throw new Error("训练记录导出失败");

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "fitplan-workouts.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
}
