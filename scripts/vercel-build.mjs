import { execSync } from "node:child_process";

const runner = process.platform === "win32" ? "corepack.cmd pnpm" : "corepack pnpm";

function run(args) {
  const command = `${runner} ${args.join(" ")}`;
  console.log(`\n[vercel-build] $ ${command}`);
  execSync(command, { stdio: "inherit", shell: true });
}

console.log("[vercel-build] 生成 Prisma Client...");
run(["--filter", "@fitplan/api", "exec", "prisma", "generate"]);

if (process.env.DATABASE_URL?.trim()) {
  console.log("[vercel-build] 检测到 DATABASE_URL，执行迁移与种子数据...");
  run(["--filter", "@fitplan/api", "db:deploy"]);
  run(["--filter", "@fitplan/api", "db:seed"]);
} else {
  console.log(
    "[vercel-build] 未设置 DATABASE_URL，跳过迁移与种子数据（临时/预览部署模式，函数以内存存储运行）"
  );
}

console.log("[vercel-build] 构建前端...");
run(["--filter", "@fitplan/web", "build"]);
