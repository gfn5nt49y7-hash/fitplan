import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Vercel Serverless Function 入口。
 *
 * 前端静态文件与 API 部署在同一个 Vercel 项目、同一个域名下，
 * 因此前端不需要 VITE_API_BASE_URL，vercel.json 把 /api/* 全部转发到这里。
 *
 * Fastify 实例在函数实例内复用，避免每次请求重新注册路由。
 */
type FitPlanApp = Awaited<ReturnType<typeof import("../apps/api/src/app.js").buildApp>>;

let appPromise: Promise<FitPlanApp> | undefined;

function getApp(): Promise<FitPlanApp> {
  if (!appPromise) {
    appPromise = (async () => {
      const { buildApp } = await import("../apps/api/src/app.js");
      const app = buildApp({ logger: false });
      await app.ready();
      return app;
    })();
  }
  return appPromise;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const app = await getApp();
  app.server.emit("request", req, res);
}
