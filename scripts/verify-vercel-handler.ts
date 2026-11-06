import { createServer } from "node:http";
import handler from "../api/index.js";

/**
 * 本地验证 Vercel Serverless 入口能否正常响应，不需要真的部署。
 * 用法：FITPLAN_STORAGE=json pnpm exec tsx scripts/verify-vercel-handler.ts
 */
const server = createServer((req, res) => {
  void handler(req, res);
});

server.listen(0, "127.0.0.1", async () => {
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/health`);
    const body = await response.text();
    console.log(`status=${response.status} body=${body}`);
    if (!response.ok) process.exitCode = 1;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
