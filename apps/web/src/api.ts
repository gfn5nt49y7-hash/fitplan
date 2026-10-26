import type { ApiError, ApiSuccess } from "@fitplan/contracts";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(apiBaseUrl + path, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
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
