import { defineConfig } from "vitest/config";

/**
 * 单元测试固定使用 JSON 存储，避免本机 .env 指向 PostgreSQL 时
 * 因数据库未启动而整片失败；CI 同样不依赖外部数据库。
 */
export default defineConfig({
  test: {
    env: {
      FITPLAN_STORAGE: "json"
    }
  }
});
