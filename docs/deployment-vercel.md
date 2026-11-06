# FitPlan 零卡部署（Vercel Hobby + Neon）

## 为什么需要这份文档

Render 的免费 Web Service 会要求绑定银行卡做反滥用 / 身份验证（`$1` 临时预授权，完成后撤销退款）。没有可国际支付的卡时，无论换邮箱、换 GitHub 还是 Apple 登录都绕不过去。

Vercel Hobby 是另一条路：官方文档写明免费层「没有账单周期」，注册不需要信用卡；用已有的 GitHub 账号一键登录即可。Cloudflare 官网也明确写着 "No credit card required"。Neon 免费 PostgreSQL 同样不需要卡。

> 限制：Vercel Hobby 按条款仅限**个人 / 非商业**用途，FitPlan 作为学习与演示项目符合；若以后商业化，需升级 Pro 或迁到其他平台。

## 架构

一个 Vercel 项目同时托管前端和 API，**同源**，因此没有跨域问题：

| 路径 | 来源 |
| --- | --- |
| `/`、静态资源 | `apps/web/dist`（Vue 构建产物） |
| `/api/*` | `api/index.ts`（包装 Fastify 的 Serverless Function） |
| 数据 | Neon PostgreSQL，经 Prisma 访问 |

前端 `apps/web/src/api.ts` 在 `VITE_API_BASE_URL` 为空时使用相对路径，所以**这个变量不要填**。`vercel.json` 的 `rewrites` 会把 `/api/*` 转发到函数，Fastify 收到的仍是原始路径。

相关文件：`vercel.json`（构建、路由、Prisma 引擎打包）、`api/index.ts`（函数入口）、`scripts/verify-vercel-handler.ts`（本地验证脚本）。根 `package.json` 的 `"type": "module"` 保证函数以 ESM 输出，兼容存储层的顶层 `await`。

## 你的操作步骤

1. 打开 **`vercel.com/signup`（注册页）** → **Continue with GitHub**，用现有 GitHub 账号授权。**必须走 Sign up，不要走 Log in**：在登录页点 GitHub 会报 `Social Account is not yet connected to any Vercel user`，因为登录页只匹配已有账户，不会自动开户；若已看到这条黄色提示，直接点其中的 **Sign up?** 即可。Hobby (Free) 是默认免费层，不要点任何 Upgrade / Pro trial。

   用 Git 平台注册是「授权即完成」，Vercel 官方流程不要求邮箱验证（只有用邮箱注册才发六位 OTP），因此不会重演 Apple 隐藏邮件地址收不到信的问题。若注册过程中让填邮箱，填你能正常收信的常用邮箱，不要填 `@privaterelay.appleid.com`。
2. **Add New → Project → Import** 仓库 `gfn5nt49y7-hash/fitplan`，分支务必选 **`develop`**（仓库默认分支 `main` 是早期静态版，代码在 `develop`）。
3. Framework Preset 选 **Other**，Root Directory 留空（仓库根）。`vercel.json` 已经固定了安装命令、构建命令和产物目录，不需要手填。
4. 在 **Environment Variables** 添加：

   | 变量 | 值 |
   | --- | --- |
   | `DATABASE_URL` | Neon 的 PostgreSQL **直连**连接串，带 `sslmode=require`，不要发到聊天或写进仓库 |
   | `FITPLAN_STORAGE` | `postgres` |
   | `WEB_ORIGIN` | 可留空；若要填，写 Vercel 项目完整地址（不带末尾斜杠） |
   | `VITE_API_BASE_URL` | **不要填**（同源） |

   `NODE_VERSION` 用平台默认 22 即可，或在项目 Settings → General 里确认。
5. 点 **Deploy**。构建日志应依次出现 `prisma generate` → `prisma migrate deploy` → seed → `vite build`。迁移和种子脚本在每次部署时执行，种子按 slug 更新内置数据，不会删除用户数据。

## 部署后验收

```text
https://<项目名>.vercel.app/api/v1/health
```

应返回 `status: ok`、`mode: postgres`、`persistence: postgresql`。然后打开首页注册账号、创建一条训练记录、刷新确认数据仍在，并在 Neon 控制台确认记录已写入。

## 首次部署可能要调的地方

Vercel 会把函数单独打包，pnpm monorepo + Prisma 偶发以下问题。若构建或运行失败，把 Vercel 的构建 / 运行时日志发回即可定位：

| 症状 | 处理 |
| --- | --- |
| `Query engine library ... not found` | Prisma 二进制引擎没被包含。`vercel.json` 的 `includeFiles` 已覆盖常见 pnpm 路径；按日志里的实际路径再补一条 glob |
| `Top-level await is not supported` | 函数被编译成 CJS。确认根 `package.json` 的 `"type": "module"` 已随代码推送 |
| `prisma migrate deploy` 失败 | 把 `DATABASE_URL` 换成 Neon 的**直连**串（主机名不含 `-pooler`）后重试 |
| 首页能开但接口 404 | 检查 `vercel.json` 的 `rewrites` 是否生效，以及函数是否成功构建 |

本地可以先跑一次函数入口验证，不需要部署：

```bash
FITPLAN_STORAGE=json pnpm --filter @fitplan/api exec tsx ../../scripts/verify-vercel-handler.ts
```

预期输出 `status=200` 和一段健康检查 JSON。

## 临时兜底：连账号都不用注册

如果不想等 Vercel 构建，也可以立刻得到一个可分享的演示链接：本机启动 API，用 Cloudflare Quick Tunnel 暴露 HTTPS 地址；前端把 `apps/web/dist` 整个文件夹拖到 `app.netlify.com/drop`（Netlify Drop，无需账号、无需卡）。此时构建前端要把 `VITE_API_BASE_URL` 设为隧道地址，API 的 `WEB_ORIGIN` 设为 Netlify 地址。

代价：电脑需要常开，隧道地址每次重启会变，变了要重新构建前端。适合临时演示，不适合长期在线。

## 迁移与回退

代码在 GitHub、数据在 Neon、域名可自己换，Vercel 不构成绑定。以后想迁回 Render 或其他 PaaS，只需要把前端 `VITE_API_BASE_URL` 和 API 的 `WEB_ORIGIN` 改成跨域名写法，其余构建命令与环境变量照旧，参见 `docs/deployment.md`。
