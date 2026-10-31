# FitPlan 免费部署指南

目标架构：Cloudflare Pages 托管 Vue 前端，Render 运行 Fastify API，Neon 提供云端 PostgreSQL。三者都有免费套餐，代码和数据均不绑定厂商，后续可以迁移。

## 架构与环境变量

浏览器访问 Cloudflare Pages，前端通过 `VITE_API_BASE_URL` 请求 Render API；API 通过 `DATABASE_URL` 连接 Neon。`WEB_ORIGIN` 限制允许跨域访问 API 的前端地址。

不要把真实密码、连接串写入仓库。本地 `apps/api/.env` 已被 Git 忽略，云端密钥只填写在平台的 Environment Variables 页面。

## 1. 创建 Neon 数据库

1. 在 Neon 创建项目，区域选择离 Render 服务较近的区域。
2. 创建数据库（可命名为 `fitplan`），复制带用户名、密码、主机和 `sslmode=require` 的连接串。
3. 连接串只保存到 Render 的 `DATABASE_URL`，不要发到聊天群或提交到 Git。

首次部署时，Render 构建命令会自动执行 Prisma 迁移和种子脚本，创建表并写入内置动作与计划。种子脚本按 slug 更新内置数据，不会删除用户账号、训练记录或自定义计划。

## 2. 部署 Render API

在 Render 选择 **New → Blueprint**，连接 GitHub 仓库并选择 `develop` 分支。仓库根目录的 `render.yaml` 会定义免费 Web Service。

需要填写的环境变量：

| 变量 | 值 |
| --- | --- |
| `DATABASE_URL` | Neon 的 PostgreSQL 连接串 |
| `WEB_ORIGIN` | Cloudflare Pages 的完整前端地址，例如 `https://fitplan.pages.dev`，不要带末尾斜杠 |

`FITPLAN_STORAGE=postgres`、`NODE_VERSION=22` 已在配置中固定。健康检查路径为 `/api/v1/health`。

部署后访问：

```text
https://<你的API域名>/api/v1/health
```

应返回 `status: ok`、`mode: postgres`、`persistence: postgresql`。

注意：Render 免费 Web Service 闲置 15 分钟后会休眠，下次请求可能需要约一分钟唤醒。不要在 Render 免费实例中使用其本地文件保存业务数据；本项目使用 Neon，不受实例本地文件系统易失性的影响。

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
