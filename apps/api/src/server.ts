import "./env.js";
import { buildApp } from "./app.js";
import { store } from "./store/index.js";

const app = buildApp({ logger: true });
const port = Number.parseInt(process.env.PORT ?? "8787", 10);
const host = process.env.HOST ?? "0.0.0.0";

async function shutdown(signal: string) {
  app.log.info({ signal }, "shutting down");
  await app.close();
  await store.close();
  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

app.log.info({ storage: store.kind }, "fitplan api storage backend");

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  await store.close();
  process.exit(1);
}
