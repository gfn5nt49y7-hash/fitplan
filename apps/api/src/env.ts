import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 极简 .env 加载器（不引入 dotenv 依赖）。
 * 规则：KEY=VALUE，支持 # 注释、可选的单/双引号包裹；
 * 已经在 shell 里设置的变量优先级更高，不会被文件覆盖。
 */
/**
 * 定位 .env 所在目录。ESM 下用模块自身路径；被打包成 CommonJS
 * （例如部分 Serverless 构建器）时 import.meta 不可用，退回工作目录。
 * 云端平台靠 process.env 注入变量，本来就不应读取本地 .env 文件。
 */
function resolveModuleDirectory(): string {
  try {
    return dirname(fileURLToPath(import.meta.url));
  } catch {
    return process.cwd();
  }
}

const envFile = resolve(resolveModuleDirectory(), "..", ".env");

if (existsSync(envFile)) {
  const content = readFileSync(envFile, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator <= 0) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
