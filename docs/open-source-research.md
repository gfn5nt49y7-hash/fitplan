# 开源项目调研与技术决策

调研日期：2026-10-26。Star 数会变化，本文只用于判断成熟度和项目方向。

## 1. 调研结论

FitPlan 采用自研产品，不直接 Fork 现成健身应用。原因是 FitPlan 面向中国大陆公开用户，计划同时提供 Web 与微信小程序，现成项目在语言、交互、云端、合规和授权上都不能直接满足要求。

可借用成熟项目的领域模型、接口设计和工程质量做法，但复制代码前必须核对许可证。

## 2. 参考项目

### workout.cool

- 地址：https://github.com/Snouzy/workout-cool
- 代码许可证：MIT
- 调研时约 8.6k Stars
- 技术栈：Next.js、React、TypeScript、Prisma、PostgreSQL、Better Auth
- 特点：训练计划、动作数据库、训练记录、订阅、国际化、测试和 Docker 部署
- 可借鉴：Prisma 数据建模、计划与训练的关系、动作属性、服务端校验、部署文档
- 不直接采用：Next.js 前后端紧耦合；国际化字段硬编码过多；支付和订阅对首版过重

### openGym

- 地址：https://github.com/DuarteSantos8/openGym
- 代码许可证：AGPL-3.0
- 调研时约 15.9k Stars
- 技术栈：React 19、Vite、Node.js API、PWA、Capacitor
- 特点：训练计划、组数记录、进度统计、导入导出、PWA、手机 App、离线同步、OpenAPI
- 可借鉴：前端与 API 分离、OpenAPI 契约、纯函数保存训练计算逻辑、PWA 和离线体验、导入导出
- 不直接采用：AGPL 授权会约束修改后的网络服务；JSON 文件存储不适合公开多用户产品；动作媒体有单独许可

### wger

- 地址：https://github.com/wger-project/wger
- 代码许可证：AGPL-3.0-or-later
- 调研时约 7.2k Stars
- 技术栈：Python、Django、REST API；移动端采用 Flutter
- 特点：多用户、训练计划、自动进阶、身体数据、营养、动作库、自托管、移动客户端
- 可借鉴：成熟健身领域的数据关系、多用户权限、REST API、跨客户端集成和模块拆分
- 不直接采用：技术栈不一致；功能范围明显大于首版；AGPL 和迁移成本较高

### exercises-dataset

- 地址：https://github.com/hasaneyldrm/exercises-dataset
- 代码和数据集结构许可证：MIT
- 动作图片与 GIF：版权归 Gym visual，具有独立使用限制
- 内容：1,324 个动作、10 种语言（含中文）、动作步骤、目标肌群和器械信息
- 可借鉴：动作字段结构、中文动作说明、CSV/JSON 导入方式
- 使用限制：生产环境不能因为仓库开源就直接复制图片或 GIF；必须核对 Gym visual 授权和署名条件。首版优先使用自写文字，媒体另行采购或使用有明确授权的素材

### 微信小程序项目搜索

检索结果中多数是 2020–2022 年的健身房预约或毕业设计项目，Star 数较低，更新不活跃，且业务重点是会员和课程预约，不是训练记录。因此不作为代码基础，只参考微信登录、手机号授权和页面结构。

## 3. 技术决策

- Web 前端：Vue 3、TypeScript、Vite
- 小程序前端：后续使用 uni-app Vue，仅重做界面，不使用 Web 的 DOM 代码
- 后端：Node.js、Fastify、TypeScript
- 数据库：PostgreSQL
- 数据访问：Prisma
- API：REST、JSON、OpenAPI，统一前缀 /api/v1
- 共享类型：packages/contracts
- Web 登录：安全 Cookie 会话
- 小程序登录：短期 Bearer Token，后续增加微信身份绑定
- 图片：腾讯云 COS 或阿里云 OSS
- 测试：Vitest 与 Playwright

不在首版采用 Next.js 全栈模式。网站、小程序和未来的管理后台都通过独立 API 访问数据，减少平台绑定。

## 4. 数据模型调整

根据调研，正式模型增加 workout_session_exercises 中间表：

- 保留一次训练中动作的显示顺序
- 保留该次训练使用的动作名称快照
- 即使管理员以后修改或下架动作，历史训练仍按当时内容展示
- workout_sets 改为关联 workout_session_exercises，而不是直接关联 exercise
- 每组增加 set_type，用于区分重量次数、自重、计时等类型
- 每次训练增加 created_via，记录来自 web、miniapp 或 import

首版仍保持两类核心私密实体：训练会话和每组数据。计划模板可以复杂，但用户实际训练历史必须保存当时的快照。

## 5. 明确不做

- 不直接复制 OpenGym、wger 或 workout.cool 的整套代码
- 不直接复制 Gym visual 的动作图片与 GIF
- 不把业务逻辑写成只有 Vue 页面可调的内部函数
- 不在第一版加入支付、AI、社交和营养数据库
- 不先分别开发两套互不相干的 Web 与小程序后端

## 6. 下一步

1. 更新数据库模型，加入训练动作中间表和快照字段。
2. 在 develop 分支建立 apps/web、apps/api 和 packages/contracts。
3. 先定义用户、登录、训练计划、训练记录和统计的 OpenAPI 契约。
4. 开发登录页和训练记录前端，同时使用符合契约的模拟 API。
5. 创建国内云环境后，将模拟 API 替换为真实数据库和手机号认证。
6. 对动作数据和图片完成授权审核后，再导入正式动作库。
