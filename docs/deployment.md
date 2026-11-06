# FitPlan 免费部署指南

目标架构：Cloudflare Pages 托管 Vue 前端，Render 运行 Fastify API，Neon 提供云端 PostgreSQL。三者都有免费套餐，代码和数据均不绑定厂商，后续可以迁移。Render 免费 Web Service 会要求绑卡做身份验证（`$1` 临时预授权、会撤销，非收费），详见 2.1 节。

## 架构与环境变量

浏览器访问 Cloudflare Pages，前端通过 `VITE_API_BASE_URL` 请求 Render API；API 通过 `DATABASE_URL` 连接 Neon。`WEB_ORIGIN` 限制允许跨域访问 API 的前端地址。

不要把真实密码、连接串写入仓库。本地 `apps/api/.env` 已被 Git 忽略，云端密钥只填写在平台的 Environment Variables 页面。

## 1. 创建 Neon 数据库

1. 在 Neon 创建项目，区域选择离 Render 服务较近的区域。
2. 创建数据库（可命名为 `fitplan`），复制带用户名、密码、主机和 `sslmode=require` 的连接串。
3. 连接串只保存到 Render 的 `DATABASE_URL`，不要发到聊天群或提交到 Git。

首次部署时，Render 构建命令会自动执行 Prisma 迁移和种子脚本，创建表并写入内置动作与计划。种子脚本按 slug 更新内置数据，不会删除用户账号、训练记录或自定义计划。

## 2. 部署 Render API

在 Render 选择 **New → Blueprint**，连接 GitHub 仓库并选择 `develop` 分支（注意：仓库默认分支是 `main`，代码在 `develop`，不要选错）。仓库根目录的 `render.yaml` 会定义免费 Web Service。

注册账号这一步容易踩坑，按下面顺序来：

1. 优先用**常用邮箱（QQ / 163 / Gmail 等）+ 密码**直接注册，验证邮件直达你的收件箱；完成验证后再到 Render 里授权连接 GitHub 仓库。
2. 如果 GitHub 账户是用 **Sign in with Apple** 注册的，GitHub 对外提供的是 Apple 生成的随机中转地址 `xxxxx@privaterelay.appleid.com`。用 GitHub 登录 Render 时，Render 会拿到这个地址并把验证邮件发过去，再由 Apple 转发到你的真实邮箱；转发可能延迟、被判为垃圾邮件，或因中转地址被停用而彻底收不到。**所以「用 GitHub 登录跳过邮箱验证」并不成立，不要走这条路。**
3. 若确实要用 GitHub 登录，先到 GitHub → Settings → Emails 添加一个常用邮箱并设为 Primary，再回来登录。

验证邮件收不到时：iPhone 设置 → 顶部 Apple ID → iCloud → 隐藏邮件地址，找到该中转地址查看「转发至」的真实邮箱，然后去那个邮箱的垃圾邮件里搜 `Render`。

需要填写的环境变量：

| 变量 | 值 |
| --- | --- |
| `DATABASE_URL` | Neon 的 PostgreSQL 连接串（只在 Render 里粘贴，不要发给任何人或写进仓库） |
| `WEB_ORIGIN` | 前端完整地址，例如 `https://fitplan.pages.dev`，不要带末尾斜杠 |

`WEB_ORIGIN` 支持**逗号分隔多个地址**，用于同时放行正式域名和 Pages 预览域名，例如：

```text
https://fitplan.pages.dev,https://a1b2c3d4.fitplan.pages.dev
```

前端还没部署时可以先填 `http://localhost:5173`，等拿到 Pages 地址后再回来改成实际地址并重新部署一次。

`FITPLAN_STORAGE=postgres`、`NODE_VERSION=22` 已在配置中固定。健康检查路径为 `/api/v1/health`。

部署后访问：

```text
https://<你的API域名>/api/v1/health
```

应返回 `status: ok`、`mode: postgres`、`persistence: postgresql`。

注意：Render 免费 Web Service 闲置 15 分钟后会休眠，下次请求可能需要约一分钟唤醒。不要在 Render 免费实例中使用其本地文件保存业务数据；本项目使用 Neon，不受实例本地文件系统易失性的影响。

### 2.1 绑卡验证与零卡备选

Render 在创建免费 Web Service 时可能要求添加银行卡，这是**平台级的反滥用 / 身份验证**，与注册邮箱、GitHub 还是 Apple 登录都无关，换邮箱或换登录方式均无法绕过。

- 官方说明：`$1 USD` 交易只是验证卡片有效性的安全检查，**完成后立即撤销并退款**，不是扣费、不是订阅；免费套餐本身 0 元。
- 接受借记卡（debit card），带 Visa / Mastercard 且支持国际支付即可。
- 本仓库 `render.yaml` 明确写了 `plan: free`，不含付费实例类型，因此过验证后不会产生计算费用。若 blueprint 里写了付费实例类型，也会弹绑卡，那种是真实计费，需检查配置。
- 卡只用于验证身份，**不构成平台绑定**：代码在 GitHub、数据在 Neon、前端域名可随时更换，迁移路径见第 5 节。

换到其他 PaaS 基本躲不开这一步：Koyeb 免费 Web Service 同样要卡（约 $29 预授权），Railway 只有试用额度、用完需绑卡，Fly.io 自 2024 年起已无免费层。

确实不想绑卡时只剩两条路：

| 方案 | 做法 | 代价 |
| --- | --- | --- |
| 本地后端 + 内网穿透（临时演示） | 本机以 `pnpm --filter @fitplan/api start` 启动 API，用 Cloudflare Tunnel 暴露 HTTPS 地址；Cloudflare Pages 的 `VITE_API_BASE_URL` 与 API 的 `WEB_ORIGIN` 都填这个地址 | 电脑需常开、依赖家庭网络，不是真·云端；但代码零改动，当天即可分享链接 |
| 改造成 Serverless | 把 Fastify 入口改为 serverless handler，Prisma 改用 Neon serverless driver 或 Prisma Accelerate，再部署到 Vercel / Netlify / Cloudflare Workers 的免费层 | 需改动较多代码；Cloudflare Workers 无法运行 Prisma 原生引擎，只支持后两者 |

结论：若手上有可用的国际支付卡，直接用 `$1` 验证是代价最小、改动为零的路径。

## 3. 部署 Cloudflare Pages 前端

在 Cloudflare 选择 **Workers & Pages → Create → Pages → Connect to Git**，选择同一仓库和 `develop` 分支。

| 配置项 | 值 |
| --- | --- |
| Framework preset | Vue |
| Root directory | 仓库根目录，留空 |
| Build command | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @fitplan/web build` |
| Build output directory | `apps/web/dist` |
| `NODE_VERSION` | `22` |
| `VITE_API_BASE_URL` | Render API 的完整地址，例如 `https://fitplan-api.onrender.com`，不要带末尾斜杠 |

前端代码只依赖 Node.js 构建；Vue 与共享 contracts 会通过 pnpm workspace 一起安装。保存后等待构建完成，打开 Pages 分配的网址。

如果前端已经部署但 API 地址后来发生变化，更新 `VITE_API_BASE_URL` 后必须重新构建；仅修改运行时设置不会改变已经打包的 JavaScript。

## 4. 上线验收

1. 页面能打开，浏览器控制台没有 CORS 或混合内容错误。
2. 注册一个新账号，创建训练记录并刷新页面，确认记录仍存在。
3. 修改、删除记录，检查周统计和 CSV 导出。
4. 在 Neon 控制台确认用户与记录已写入。
5. 等 API 休眠后再访问一次，确认唤醒后数据仍在。

## 5. 后续更新与迁移

推送到 `develop` 后，Render 和 Cloudflare 会自动重新部署。数据库迁移会在 API 构建时执行；包含破坏性变更的迁移仍应先备份。

更换数据库时，先用 `pg_dump` 备份旧库，恢复到新库并核对数据，再修改 Render 的 `DATABASE_URL`。确认新环境稳定前不要删除旧库。更换托管平台只需沿用相同构建命令和环境变量；绑定独立域名后，迁移平台可以不影响用户访问地址。

## 免费版边界

免费服务适合学习、演示和少量用户体验，不保证持续在线与响应速度。正式运营前应补齐自动备份、限流、邮箱验证与找回密码，并根据使用量升级服务。
