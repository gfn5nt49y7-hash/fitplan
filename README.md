# FitPlan

FitPlan 是一个面向健身初学者的轻量训练计划与训练记录网站。

## 功能

- 查看三种适合新手的训练计划
- 选择计划后生成训练表单
- 记录每个动作的重量、次数和组数
- 使用浏览器 localStorage 保存训练记录
- 支持手机和桌面端布局

## 使用方式

打开 `index.html` 即可使用。网站不需要安装依赖，也不需要后端服务。

计划选择、训练记录和最近训练区域均已连接到 `app.js`。刷新页面后记录仍会保留在当前浏览器中。

## 项目文件

- `index.html`：页面结构和网站内容
- `styles.css`：响应式视觉样式
- `app.js`：训练计划、表单和 localStorage 交互
- `README.md`：项目介绍与使用说明

## 第一版范围

暂不包含账号登录、云端同步、社交功能和 AI 训练建议。

## 健康提示

训练内容仅供一般健身参考，不替代医生或专业教练的建议。开始新的训练计划前，请确认自身身体状况和动作安全。


## 分支说明

- main：当前 GitHub Pages 静态演示版
- develop：正式版前后端开发分支

正式版采用 pnpm monorepo：

- apps/web：Vue 3 + TypeScript + Vite
- apps/api：Fastify + TypeScript，当前使用内存模拟数据
- packages/contracts：Web、API 与未来微信小程序共享的数据契约

## 本地开发

需要 Node.js 22 和 pnpm 10。

安装依赖：

    pnpm install

启动 API：

    pnpm dev:api

另开一个终端启动网站：

    pnpm dev:web

默认地址：

- 网站：http://localhost:5173
- API：http://localhost:8787
- 健康检查：http://localhost:8787/api/v1/health

## 质量检查

    pnpm typecheck
    pnpm test
    pnpm build

GitHub Actions 会在 develop 和 main 分支推送时执行以上检查。

## 开发阶段说明

当前后端使用内存模拟数据，API 服务重启后训练记录会清空。这是为了先稳定前端接口和交互；下一步接入 PostgreSQL、手机号认证和云端数据同步。

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
