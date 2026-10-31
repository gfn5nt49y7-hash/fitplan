import "../env.js";
import type { FitPlanStore } from "./types.js";

/**
 * 存储层入口：根据环境变量决定用哪个实现。
 *
 *   FITPLAN_STORAGE=postgres  → PostgreSQL（Prisma）
 *   FITPLAN_STORAGE=json      → 本地 JSON 文件（零依赖，适合离线调试）
 *
 * 不设置时：有 DATABASE_URL 就用 PostgreSQL，否则回退 JSON。
 */
export type { FitPlanStore, PlanDetail } from "./types.js";

function resolveStorageMode(): "postgres" | "json" {
  const configured = process.env.FITPLAN_STORAGE?.trim().toLowerCase();
  if (configured === "postgres" || configured === "json") return configured;
  return process.env.DATABASE_URL?.trim() ? "postgres" : "json";
}

const mode = resolveStorageMode();

if (mode === "postgres" && !process.env.DATABASE_URL?.trim()) {
  throw new Error(
    "FITPLAN_STORAGE=postgres 但缺少 DATABASE_URL，请检查 apps/api/.env"
  );
}

export const store: FitPlanStore =
  mode === "postgres"
    ? (await import("./prisma-store.js")).prismaStore
    : (await import("./json-store.js")).jsonStore;
