# FitPlan

FitPlan 是一个面向健身初学者的轻量训练计划与训练记录网站。

## 功能

- 按胸、肩、背、腿、手臂和核心筛选训练计划
- 训练计划页解释专项性、超负荷、进阶、训练量、频率、恢复与 FITT-VP 逻辑
- 训练计划、进度、动作库、解剖和记录页面标注 NASM、ACE、ACSM 等来源及适用范围
- 训练计划、训练进度、动作库、训练记录和账号设置使用独立页面
- 动作库提供肩、肘、髋、膝、踝和躯干的运动学基础与动作选择逻辑
- 人体肌肉解剖页面提供正反面可点击肌群、名称、功能和对应训练动作
- 提供全身、上下肢分化、推拉腿、5×5 和居家训练等常见方案
- 使用 DIY 表单创建、分类和删除自己的训练计划
- 多训练日计划可切换上肢、下肢、推、拉、腿等训练内容
- 记录每个动作的重量、次数、组数和计时动作
- 邮箱账号注册、登录和用户级训练数据隔离
- 训练记录新增、编辑、删除、周进度统计和 CSV 导出
- 支持手机和桌面端布局

## 健康提示

训练内容仅供一般健身参考，不替代医生或专业教练的建议。开始新的训练计划前，请确认自身身体状况和动作安全。


## 分支说明

- main：当前 GitHub Pages 静态演示版
- develop：正式版前后端开发分支

正式版采用 pnpm monorepo：

- apps/web：Vue 3 + TypeScript + Vite
- apps/api：Fastify + TypeScript，数据存 PostgreSQL（Prisma），可降级为本地 JSON 文件
- packages/contracts：Web、API 与未来微信小程序共享的数据契约

## 本地开发

需要 Node.js 22 和 pnpm 10。

安装依赖：

    pnpm install

先启动数据库（首次使用见下一节）：

    scripts\db-start.cmd

启动 API：

    pnpm dev:api

另开一个终端启动网站：

    pnpm dev:web

默认地址：

- 网站：http://localhost:5173
- API：http://localhost:8787
- 健康检查：http://localhost:8787/api/v1/health

## 数据库（PostgreSQL）

开发环境使用便携版 PostgreSQL 17，免安装、不注册系统服务，只监听本机：

| 项目 | 位置 |
|------|------|
| 程序 | `C:\Users\Lenovo\tools\pg17` |
| 数据目录 | `C:\Users\Lenovo\pgdata\fitplan` |
| 端口 | 5433（避免和系统里其他 PostgreSQL 冲突） |
| 库 / 用户 | `fitplan` / `fitplan` |
| 连接串 | 见 `apps/api/.env` 的 `DATABASE_URL` |

常用命令：

    scripts\db-start.cmd        # 启动数据库
    scripts\db-stop.cmd         # 停止数据库
    scripts\db-psql.cmd         # 进入 psql，可直接写 SQL

    pnpm --filter @fitplan/api db:deploy   # 应用迁移（建表/改表）
    pnpm --filter @fitplan/api db:seed     # 灌入 18 个动作 + 12 个内置计划
    pnpm --filter @fitplan/api db:studio   # 打开 Prisma Studio 图形界面看数据

存储层有两套实现，用 `FITPLAN_STORAGE` 切换：

- `postgres`：走 Prisma + PostgreSQL（默认，适合正常开发）
- `json`：写 `apps/api/.data/fitplan-store.json`，不需要数据库，适合离线看前端

## 质量检查

    pnpm typecheck
    pnpm test
    pnpm build

GitHub Actions 会在 develop 和 main 分支推送时执行以上检查。

## 开发阶段说明

数据已落 PostgreSQL：重启 API 不再丢数据，训练记录、自定义计划、登录会话都存表里，写入走事务、外键级联删除、重量用 `Decimal(6,2)` 保证精度。`FITPLAN_STORAGE=json` 时回退到本地 JSON 文件，方便没有数据库时也能跑。

下一步：手机号认证、微信小程序端与自动备份。

## 云端部署

仓库已包含 Render Blueprint（`render.yaml`）和免费部署指南，采用 Cloudflare Pages + Render + Neon PostgreSQL：

- 完整步骤：`docs/deployment.md`
- 前端通过 `VITE_API_BASE_URL` 指定线上 API
- API 通过 `WEB_ORIGIN` 允许前端跨域访问
- 云端连接串和密钥只填写在平台环境变量中，不提交到 Git

## 开发版功能

- 邮箱注册、登录、自动恢复会话和退出登录
- 用户资料与昵称管理
- 训练计划和动作说明
- 训练记录新增、编辑和删除
- 本周训练次数、连续天数和总组数
- CSV 训练数据导出
- 注销账号并清除该账号全部开发数据
- 用户级训练数据隔离
- API 自动测试、TypeScript 检查和生产构建

PostgreSQL 的 Prisma 模型、初始迁移和种子数据已经准备好，但当前运行时仍默认使用内存存储。配置数据库后将切换为持久化存储。

## 素材许可

人体肌肉解剖插画基于 OpenStax、Tomáš Kebert 与 umimeto.org 的
[Muscles front and back](https://commons.wikimedia.org/wiki/File:Muscles_front_and_back.svg)
素材，依据 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 使用；FitPlan 对其进行了裁切并叠加中文训练标注。
