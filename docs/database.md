# 数据库说明（PostgreSQL）

## 1. 整体结构

```
Vue 前端 (5173)
   │  /api/v1/*  (Vite 代理)
   ▼
Fastify API (8787)
   │  src/store/index.ts  ← 按 FITPLAN_STORAGE 选择实现
   ├── store/prisma-store.ts  →  Prisma  →  PostgreSQL (5433)   ← 当前使用
   └── store/json-store.ts    →  apps/api/.data/fitplan-store.json （备用）
```

两个实现都遵守 `src/store/types.ts` 里的 `FitPlanStore` 接口，所以业务代码（`app.ts`）完全不需要知道自己连的是哪种存储。接口里返回值类型写成 `MaybePromise<T>`，JSON 实现同步返回、Prisma 实现返回 Promise，调用方统一 `await`。

## 2. 本地实例信息

| 项目 | 值 |
|------|-----|
| 版本 | PostgreSQL 17.6（便携版，解压即用） |
| 程序目录 | `C:\Users\Lenovo\tools\pg17` |
| 数据目录 | `C:\Users\Lenovo\pgdata\fitplan` |
| 端口 | 5433，只监听 127.0.0.1 |
| 库名 / 属主 | `fitplan` / `fitplan` |
| 超级用户 | `postgres`（口令见创建时的初始化口令，仅本地使用） |
| 连接串 | `postgresql://fitplan:fitplan_dev_2026@127.0.0.1:5433/fitplan?schema=public` |

`initdb` 参数：`--encoding=UTF8 --locale=C --auth-host=scram-sha-256`，所以 TCP 连接必须带口令，乱码问题也不存在（库是 UTF-8）。

## 3. 日常操作

```bat
scripts\db-start.cmd            :: 启动（已在运行则直接返回）
scripts\db-stop.cmd             :: 停止
scripts\db-psql.cmd             :: 进 psql
scripts\db-psql.cmd -c "select count(*) from users;"
```

```bash
pnpm --filter @fitplan/api db:deploy   # 应用迁移
pnpm --filter @fitplan/api db:seed     # 灌入 18 动作 + 12 计划
pnpm --filter @fitplan/api db:studio   # 图形化看表
```

## 4. 表与业务对象的对应

| 表 | 存什么 | 关键约束 |
|----|--------|----------|
| `users` | 账号 | `email` 唯一；密码存 `scrypt` 哈希 + 随机盐 |
| `sessions` | 登录态 | `token_hash` 唯一；只存 token 的 SHA-256，不存明文 |
| `exercises` | 动作库 | `slug` 唯一 |
| `plans` / `plan_exercises` | 训练计划与计划内动作 | 自定义计划 `owner_id` 指向用户，`(plan_id, day_number, position)` 唯一 |
| `workout_sessions` | 一次训练 | 外键指向用户与计划；`plan_name_snapshot` 固化计划名 |
| `workout_session_exercises` | 训练里的动作 | `exercise_name_snapshot` 固化动作名，动作被删也不影响历史 |
| `workout_sets` | 每一组 | `weight_kg Decimal(6,2)`、`rpe Decimal(3,1)`，不用浮点 |

删除用户会级联清掉会话、训练记录、自定义计划（`onDelete: Cascade`），这一点在 `deleteUser` 里只写了一句 `prisma.user.delete()`，剩下的交给外键。

## 5. 写操作怎么保证不半途而废

- 新建训练记录：一次 `workoutSession.create` 带嵌套 `exercises.create` + `sets.create`，Prisma 会包在一个事务里，中途失败整体回滚。
- 修改训练记录：`$transaction` 内先 `deleteMany` 旧动作再重建，避免出现「改了一半」的记录。
- 注册：靠 `email` 唯一索引兜底，并发注册同一邮箱会命中 `P2002`，接口返回 409 而不是插两条。

## 6. 备份与恢复

```bat
:: 备份（导出成 SQL 文本）
"%PGHOME%\bin\pg_dump.exe" -h 127.0.0.1 -p 5433 -U fitplan -d fitplan -F p -f backup.sql

:: 恢复到一个空库
"%PGHOME%\bin\psql.exe" -h 127.0.0.1 -p 5433 -U fitplan -d fitplan -f backup.sql
```

生产环境不要靠手工 dump：用云厂商的自动备份 / PITR，或至少加一个每日定时任务。

## 7. 常见问题

**API 启动报 `Can't reach database server`**
→ 数据库没起。跑 `scripts\db-start.cmd`。

**端口 5433 被占用**
→ `netstat -ano | findstr :5433` 找到 PID；如果之前异常退出残留了 `postmaster.pid`，删除 `C:\Users\Lenovo\pgdata\fitplan\postmaster.pid` 后重启。

**想临时不用数据库**
→ 把 `apps/api/.env` 里改成 `FITPLAN_STORAGE=json`，API 会走本地 JSON 文件，无需启动 PG。

**Prisma 报 client 未生成**
→ `pnpm --filter @fitplan/api db:generate`（每次改 `schema.prisma` 后都要重新生成）。
