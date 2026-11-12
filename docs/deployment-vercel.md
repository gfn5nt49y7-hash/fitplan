# FitPlan 零卡部署（Vercel Hobby + Neon）

## 当前线上状态（2026-11-12 实测）

已从本机用 Vercel CLI 完成生产部署，绕开网页注册、GitHub push 与本机符号链接限制：

| 项目 | 值 |
| --- | --- |
| 项目 | `2201288621-6192/fitplan` |
| 线上地址 | `https://fitplan-hazel.vercel.app` |
| 状态 | `READY` / production，`lambdaRuntimeStats: {"nodejs":1}`（函数已打包） |
| 登录账户 | Vercel CLI 设备码授权，Hobby 免费层，未绑定信用卡 |
| 当前存储 | `FITPLAN_STORAGE=json` + `FITPLAN_PERSISTENCE=off`，**内存模式，数据不持久** |
| 待办 | 在项目 Settings → Environment Variables 填 `DATABASE_URL`（Neon 直连串），把 `FITPLAN_STORAGE` 改为 `postgres`，再 `vercel --prod` 重新部署 |

> 当前链接能打开、能注册体验，但 Serverless 冷启动后数据会丢。要像正式产品一样持久，必须补上 Neon。

部署与运维命令（每次都要带中文主机名补丁，见下文）：

```bash
export NODE_OPTIONS="--require <仓库根>/scripts/vercel-hostname-ascii.cjs"
vercel whoami                 # 确认登录态
vercel ls fitplan --json      # 查看部署状态
vercel env ls                 # 查看环境变量
vercel inspect <部署URL> --logs   # 查看构建日志
vercel logs <部署URL>         # 查看运行时日志
vercel --prod                 # 重新部署
```

`.vercelignore` 用于阻止本机 `apps/api/.env`（含本机数据库口令）和 `.data/` 被上传；Vercel CLI 上传时**不完全遵循** `.gitignore`，这份文件不能删。环境变量要用 `vercel env add` 正式写入项目，命令行 `--env` 只对单次部署生效，重新部署会丢。

已知非阻断告警：Vercel 函数打包器会提示 `Using built-in TypeScript ... since typescript is missing from devDependencies`，并打印一批 `TS2345` / `TS2305` 类型错误（Zod 推断类型与 `@prisma/client` 导出）。原因是 Vercel 在根工作区用内置 TS 做全量类型检查，与本地 pnpm workspace 的类型解析不一致；**构建仍会完成、函数仍会打出包**（以 `vercel ls --json` 的 `lambdaRuntimeStats` 为准）。本地 `pnpm -r typecheck` 是全绿的，不必为此改业务代码。

国内网络提示：`vercel.app` 域名常被 DNS 污染（本机解析到 `202.160.129.6`），CLI 诊断请求也可能被代理拦截。这属于访问侧问题，不影响部署本身；用 `vercel ls` / `vercel inspect` 等平台 API 判断状态最可靠。

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
5. 点 **Deploy**。构建日志应依次出现 `prisma generate` → `prisma migrate deploy` → seed → `vite build`。迁移和种子脚本在每次部署时执行，种子按 slug 更新内置数据，不会删除用户数据。构建由 `scripts/vercel-build.mjs` 驱动：只有当 `DATABASE_URL` 存在时才执行迁移与种子，因此没有配置数据库的预览部署也能构建成功（函数退化为内存存储）。

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

## 更快的路径：先部署、后开户（Vercel 免账号部署）

Vercel 自 2026 年 10 月起支持**不登录就部署**。Vercel CLI 65 提供的 `vercel deploy --temporary` 会在本地构建后上传，返回一个 `tmp.now` 域名的真实线上链接，同时打印一个 **claim URL**：打开它把项目认领到账户即可长期保留（认领链接不要外传，任何人拿到都能认领）。未认领的部署约 1 小时后过期。

```bash
npm i -g vercel@latest
vercel deploy --temporary --yes \
  --env FITPLAN_STORAGE=json \
  --env FITPLAN_PERSISTENCE=off
```

这条路径同时绕开了网页注册的两个坑：`Social Account is not yet connected to any Vercel user` 和 Apple 隐藏邮件地址收不到验证信。开户也可以走命令行：

```bash
vercel signup --email 你的常用邮箱
```

`--email` 是官方为「编码智能体运行命令」准备的参数，CLI 会用该邮箱打开注册页；完成后 `vercel whoami` 确认登录态，再用 `vercel --prod` 部署正式版本。

### Windows 上做本地临时部署的限制（实测）

`--temporary` 是**本地构建**，Vercel 构建器缓存需要创建符号链接。在未开启「开发人员模式」或没有管理员权限的 Windows 上会报：

```text
EPERM: operation not permitted, symlink ...
```

随后重试还会遇到缓存清理失败（`BUILD_FAILED / safe-delete`）。`ln -s` 可直接验证本机是否允许创建符号链接。**这不影响正式部署**：登录后在 Vercel 云端（Linux）构建，不会碰本地符号链接。因此在 Windows 上应跳过 `--temporary`，直接走 `vercel signup` → `vercel --prod`。

另外，无 `DATABASE_URL` 时函数以内存 JSON 存储运行（`FITPLAN_STORAGE=json` + `FITPLAN_PERSISTENCE=off`），适合演示，**数据不持久**；要真正持久必须配 Neon。

### 中文计算机名会让 Vercel CLI 崩溃（本机必读）

本机计算机名是中文（`唐太宗钦赐玄黑镀银彩光七星盘`）。Vercel CLI 65 的 native 二进制会把 `os.hostname()` 塞进 HTTP 请求 header，而 header 只接受 Latin-1 字符，于是 `vercel login`、`vercel deploy` 全部报：

```text
TypeError: Cannot convert argument to a ByteString because
the character at index 0 has a value of 21776 which is greater than 255.
```

覆盖 `COMPUTERNAME` 环境变量**无效**（CLI 读的是系统 API），`VERCEL_CLI_USE_NATIVE_BINARY=0` 也已被新版移除。**不要为此改系统主机名**，用仓库里的预加载补丁把 `os.hostname()` 伪装成 ASCII 即可：

```bash
# Git Bash
export NODE_OPTIONS="--require C:/Users/Lenovo/Documents/Codex/2026-10-25/github/fitplan-next/scripts/vercel-hostname-ascii.cjs"
vercel login
vercel --prod
```

```powershell
# PowerShell
$env:NODE_OPTIONS = "--require C:\Users\Lenovo\Documents\Codex\2026-10-25\github\fitplan-next\scripts\vercel-hostname-ascii.cjs"
vercel login
vercel --prod
```

补丁见 `scripts/vercel-hostname-ascii.cjs`。`NODE_OPTIONS` 只在当前终端会话有效，不影响其他程序。登录走设备码（CLI 打印 `vercel.com/oauth/device?user_code=...`），用已有 GitHub 账号授权即可，**不会要求信用卡**。

## 临时兜底：连账号都不用注册

如果不想等 Vercel 构建，也可以立刻得到一个可分享的演示链接：本机启动 API，用 Cloudflare Quick Tunnel 暴露 HTTPS 地址；前端把 `apps/web/dist` 整个文件夹拖到 `app.netlify.com/drop`（Netlify Drop，无需账号、无需卡）。此时构建前端要把 `VITE_API_BASE_URL` 设为隧道地址，API 的 `WEB_ORIGIN` 设为 Netlify 地址。

代价：电脑需要常开，隧道地址每次重启会变，变了要重新构建前端。适合临时演示，不适合长期在线。

## 迁移与回退

代码在 GitHub、数据在 Neon、域名可自己换，Vercel 不构成绑定。以后想迁回 Render 或其他 PaaS，只需要把前端 `VITE_API_BASE_URL` 和 API 的 `WEB_ORIGIN` 改成跨域名写法，其余构建命令与环境变量照旧，参见 `docs/deployment.md`。
