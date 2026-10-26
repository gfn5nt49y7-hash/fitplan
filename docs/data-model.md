# FitPlan 数据库模型

本文档描述正式版第一阶段的数据结构、权限规则和数据迁移方案。目标数据库为 PostgreSQL，认证系统负责保存手机号等登录凭据。

## 1. 设计原则

- 用户训练记录默认完全私有。
- 公开内容与用户私有数据分表管理。
- 所有用户数据表必须启用行级权限。
- 登录手机号由认证服务管理，业务表只保存用户 ID 和脱敏后的展示信息。
- 保存原始训练组数据，统计结果由训练记录计算，避免重复保存互相矛盾的数据。
- 删除账号时级联清除个人资料、训练记录和设置。

## 2. 核心实体

| 实体 | 用途 |
|---|---|
| profiles | 用户昵称、协议同意状态和账号状态 |
| exercises | 动作名称、说明、要领和安全提示 |
| plans | 训练计划基本信息 |
| plan_exercises | 计划中的动作、顺序和目标组数/次数 |
| user_plans | 用户当前选择的计划 |
| workout_sessions | 一次完整训练 |
| workout_sets | 一次训练中每个动作的每组数据 |

## 3. 表结构

### profiles

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid, PK | 对应认证系统用户 ID |
| display_name | varchar(40) | 用户昵称 |
| phone_masked | varchar(20), nullable | 仅用于界面显示的脱敏手机号 |
| status | varchar(20) | active、disabled、deletion_pending |
| privacy_version | varchar(20) | 已同意的隐私政策版本 |
| terms_version | varchar(20) | 已同意的用户协议版本 |
| consented_at | timestamptz | 同意协议的时间 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

### exercises

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid, PK | 动作 ID |
| name | varchar(80) | 动作名称 |
| slug | varchar(80), unique | 稳定的英文标识 |
| muscle_group | varchar(40) | 主要训练部位 |
| equipment | varchar(40) | 器械要求 |
| instructions | text | 动作步骤 |
| safety_notes | text | 安全提示 |
| media_url | text, nullable | 图片或视频地址 |
| is_published | boolean | 是否公开 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

### plans

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid, PK | 计划 ID |
| name | varchar(80) | 计划名称 |
| slug | varchar(80), unique | 稳定标识 |
| description | text | 计划说明 |
| difficulty | varchar(20) | beginner、intermediate |
| estimated_minutes | integer | 预计训练时长 |
| days_per_week | smallint | 每周建议次数 |
| is_published | boolean | 是否公开 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

### plan_exercises

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid, PK | 关系 ID |
| plan_id | uuid, FK plans | 所属计划 |
| exercise_id | uuid, FK exercises | 动作 |
| day_number | smallint | 训练日序号 |
| position | smallint | 动作顺序 |
| target_sets | smallint | 建议组数 |
| target_reps | integer, nullable | 建议次数 |
| target_seconds | integer, nullable | 静力动作建议时长 |

约束：同一计划、训练日内的 position 必须唯一。

### user_plans

| 字段 | 类型 | 说明 |
|---|---|---|
| user_id | uuid, FK profiles, PK 组合 | 用户 |
| plan_id | uuid, FK plans, PK 组合 | 当前计划 |
| selected_at | timestamptz | 选择时间 |

### workout_sessions

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid, PK | 训练记录 ID |
| user_id | uuid, FK profiles | 数据所有者 |
| plan_id | uuid, FK plans, nullable | 使用的计划 |
| performed_at | timestamptz | 实际训练时间 |
| duration_minutes | integer, nullable | 训练时长 |
| notes | varchar(500), nullable | 用户备注 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

### workout_sets

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid, PK | 单组记录 ID |
| session_id | uuid, FK workout_sessions | 所属训练 |
| exercise_id | uuid, FK exercises | 动作 |
| set_number | smallint | 第几组 |
| weight_kg | numeric(6,2), nullable | 重量 |
| reps | smallint, nullable | 次数 |
| duration_seconds | integer, nullable | 静力动作持续时间 |
| rpe | numeric(3,1), nullable | 主观强度，后续版本启用 |

约束：同一训练、动作和 set_number 唯一；至少提供 reps 或 duration_seconds 其中一项。

## 4. 索引

- workout_sessions(user_id, performed_at desc)
- workout_sets(session_id)
- workout_sets(exercise_id)
- plan_exercises(plan_id, day_number, position)
- plans(is_published)
- exercises(is_published)

## 5. 行级权限

| 数据 | 普通用户权限 |
|---|---|
| profiles | 只读取和更新自己的资料 |
| plans / exercises | 只读取 is_published = true 的内容 |
| user_plans | 只操作自己的记录 |
| workout_sessions | 只读取、创建、修改和删除自己的记录 |
| workout_sets | 仅当所属 session 属于当前用户时可操作 |

管理员操作必须通过受控后端接口或专用角色完成，不能仅依赖前端隐藏按钮。

## 6. 删除策略

- 普通删除训练记录时，同时删除所属 workout_sets。
- 用户注销后进入 deletion_pending 状态，禁止再次登录。
- 删除任务清除 profiles 与全部用户训练数据。
- 备份中的历史副本按明确周期自动过期，并在隐私政策中说明。

## 7. 本地记录迁移

现有 localStorage 数据不能自动视为可信的云端记录。迁移流程应为：

1. 用户登录后主动选择“导入本机记录”。
2. 前端展示计划名称、日期和动作数量供用户确认。
3. 服务端重新校验字段和数值范围。
4. 将记录写入当前登录用户账户。
5. 记录来源标记为 imported。
6. 导入成功后允许用户选择删除本机副本。

## 8. 后续扩展

统计表可以先通过查询实时计算。只有数据量和性能达到需要时，再增加按周聚合的统计表。首期不提前增加支付、社交或 AI 相关表，避免数据结构过度复杂。
