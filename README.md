# Fullstack Project Template

AI 驱动的全栈项目模板，采用「文档即代码」理念，通过 Qoder Skill 实现从需求规划到代码生成的闭环工作流。

## 项目结构

```
fullstack-project-template/
├── backend/              # Spring Boot 后端服务 (Java 21)
├── admin/                # React 后台管理系统 (TypeScript)
├── native_app/           # Flutter 移动端应用
├── infra/                # 基础设施 (Docker Compose: MySQL + Redis)
├── docs/                 # 功能设计文档 (由 /feature-plan 生成)
├── .qoder/               # Workspace 级 Qoder 规则与技能
│   ├── rules/            # 跨项目工作流规则
│   └── skills/           # 全局 Skill (/feature-plan, /feature-execute)
└── README.md
```

### 技术栈总览

| 子工程 | 技术栈 | 说明 |
|--------|--------|------|
| **backend** | Spring Boot 3 + MyBatis-Plus + Sa-Token + MySQL 8.4 | 后端 API 服务，Feature-based 模块化架构 |
| **admin** | React 19 + TypeScript + Vite + TanStack Router + TanStack Query + Tailwind + shadcn/ui | 后台管理系统，RBAC 权限控制 |
| **native_app** | Flutter + Riverpod + Freezed + GoRouter + Dio | 移动端 App，Feature-first 分层架构 |
| **infra** | Docker Compose (MySQL 8.4 + Redis 7.4) | 一键启动数据库与缓存 |

---

## 功能说明

### 后端 (backend)

采用 **Feature-based** 模块化架构，每个业务模块包含 `controller/service/dto/entity/mapper/vo` 标准分层。

| 模块 | 功能 |
|------|------|
| `auth` | App 端认证：密码登录、短信登录、注册、重置密码、Token 刷新 |
| `user` | App 用户管理：个人信息、修改密码、用户审核 |
| `admin/auth` | 管理端认证：管理员登录 |
| `admin/menu` | 菜单管理：菜单树 CRUD |
| `admin/role` | 角色管理：角色 CRUD、菜单权限分配 |
| `admin/adminuser` | 管理员管理：管理员 CRUD、角色分配 |
| `admin/user` | App 用户管理：用户列表、审核 |
| `admin/rbac` | RBAC 权限核心：Sa-Token 鉴权接口实现、数据初始化 |
| `common` | 公共模块：统一响应 `Result<T>`、全局异常处理、链路追踪日志、AOP 请求日志 |

**核心特性：**
- Sa-Token 多账户体系（App 端 + 管理端独立认证）
- Argon2 密码加密
- 链路追踪（TraceId 透传）
- 统一异常处理与错误码枚举

### 管理系统 (admin)

基于 React 19 + shadcn/ui 构建的后台管理系统。

| 页面 | 路由 | 功能 |
|------|------|------|
| 登录页 | `/login` | 管理员登录 |
| 首页 | `/` | 数据看板 |
| 菜单管理 | `/menus` | 菜单树增删改查 |
| 角色管理 | `/roles` | 角色 CRUD + 权限分配 |
| 管理员管理 | `/admin-users` | 管理员账号管理 + 角色分配 |
| App 用户管理 | `/app-users` | App 用户列表 + 审核 |

**核心特性：**
- RBAC 动态菜单与按钮级权限控制
- TanStack Router 声明式路由 + 路由守卫
- TanStack Query 数据请求与缓存
- Tailwind CSS 4 + shadcn/ui 组件库
- Token 滑动续期机制

### 移动端 (native_app)

基于 Flutter 的 Feature-first 分层架构应用。

| 功能模块 | 页面 | 功能 |
|----------|------|------|
| `auth` | 登录页 | 密码登录 / 短信登录 |
| `auth` | 注册页 | 用户注册（含审核流程） |
| `auth` | 重置密码页 | 短信验证码重置密码 |
| `auth` | 账号审核页 | 注册审核状态展示 |
| `auth` | 重新提交页 | 审核驳回后重新提交 |
| `user` | 个人信息页 | 查看与编辑个人资料 |
| `user` | 修改密码页 | 修改登录密码 |

**核心架构：**
- **分层模式**：Model (Freezed) → DataSource → Repository → ViewModel (Riverpod) → View
- **网络层**：Dio + 拦截器（Token 自动注入、异常统一处理）
- **路由**：GoRouter 声明式路由 + 认证守卫
- **设计系统**：统一的 ColorScheme、Typography、Spacing、Radius 常量
- **共享组件**：Dialog、Message（Toast）等自定义 UI 组件

### 基础设施 (infra)

```bash
cd infra && docker compose up -d
```

一键启动 MySQL 8.4 和 Redis 7.4，数据持久化到 `infra/data/` 目录。

---

## Qoder 使用流程

本项目深度集成 Qoder 的规则（rules）与技能（skills）体系，实现 AI 驱动的文档化开发。

### 三层规则与技能体系

```
workspace/.qoder/          ← 跨项目工作流规则 + 全局 Skill
├── rules/
│   ├── feature-workflow.md       # 功能开发标准流程
│   ├── docs-convention.md        # 文档命名与结构规范
│   └── sub-project-rules-priority.md  # 子项目规则优先级
└── skills/
    ├── feature-plan/SKILL.md     # 功能规划 Skill
    └── feature-execute/SKILL.md  # 功能执行 Skill

backend/.qoder/rules/      ← 后端编码规范（7 个规则文件）
admin/.qoder/rules/        ← 前端管理端编码规范（5 个规则文件）
native_app/.qoder/rules/   ← Flutter 编码规范（10 个规则文件）
```

> **优先级原则**：子项目 `.qoder/rules/` 是代码实现的**单一可信源**，根级规则仅负责跨项目协调，不得覆盖子项目规则。

### 标准开发流程

```
/feature-plan → 人工审核文档 → /feature-execute → 代码生成
```

#### 第一步：功能规划 (`/feature-plan`)

生成完整的功能设计文档集，作为后续代码生成的蓝图。

```
/feature-plan <feature-name> <feature-description> [--targets=<target1>,<target2>]
```

**示例：**

```bash
# 自动选择目标工程（弹出多选提示）
/feature-plan user 用户体系，包含登录、注册、修改密码

# 指定目标工程
/feature-plan user 用户体系 --targets=backend,native_app

# 仅后端
/feature-plan order 订单模块 --targets=backend
```

**生成的文档：**

| 文件 | 说明 | 生成条件 |
|------|------|----------|
| `docs/{feature}/requirement.md` | 需求文档（用户故事、功能列表、边界条件） | 始终生成 |
| `docs/{feature}/api.md` | 接口约束文档（请求/响应/错误码） | 始终生成 |
| `docs/{feature}/domain.md` | 数据模型文档（实体定义、表结构、枚举） | 始终生成 |
| `docs/{feature}/ui.md` | UI 文档（页面布局、交互逻辑、状态管理） | 仅前端目标时生成 |
| `docs/{feature}/task.md` | 执行任务清单（按依赖排序的代码生成步骤） | 始终生成 |

#### 第二步：人工审核

- 逐一审阅 `docs/{feature}/` 下生成的所有文档
- 可直接编辑文档内容进行修正
- 确认无误后方可进入执行阶段
- **禁止跳过审核直接执行**

#### 第三步：功能执行 (`/feature-execute`)

根据 `task.md` 中的任务清单，按顺序生成代码。

```
/feature-execute <feature-name>
```

**示例：**

```bash
/feature-execute user
```

**执行逻辑：**

1. 读取 `task.md` 中的 `<!-- targets: ... -->` 元数据，确定目标工程
2. 加载对应子项目的 `.qoder/rules/`（单一可信源）
3. 按任务顺序依次生成代码，每完成一个任务标记 `[x]`
4. 后端任务顺序：Entity → Mapper → DTO/VO → ResultCode → Service → Controller → Schema
5. 前端任务顺序：Model → DataSource → Repository → ViewModel → View → Router

### 已有功能文档

项目已包含以下功能的设计文档，可作为参考或直接执行：

| 功能 | 文档目录 | 目标工程 |
|------|----------|----------|
| 用户体系 | `docs/user/` | backend + native_app |
| 用户审核 | `docs/user-audit/` | backend + native_app |

### 完整开发示例

以「用户体系」功能为例：

```bash
# 1. 生成设计文档
/feature-plan user 用户体系，包含登录、注册、修改密码 --targets=backend,native_app

# 2. 审核文档
#    检查 docs/user/ 下的 requirement.md, api.md, domain.md, ui.md, task.md

# 3. 执行代码生成
/feature-execute user

# 4. 后端启动
cd backend && ./gradlew bootRun

# 5. 前端启动
cd native_app && flutter run

# 6. 管理端启动
cd admin && pnpm dev
```

---

## 快速开始

### 1. 启动基础设施

```bash
cd infra
docker compose up -d
```

### 2. 启动后端

```bash
cd backend
./gradlew bootRun
```

默认端口：`8080`，默认环境：`dev`

### 3. 启动管理端

```bash
cd admin
pnpm install
pnpm dev
```

### 4. 启动移动端

```bash
cd native_app
flutter pub get
flutter run
```

---

## 子项目规范

每个子项目在各自的 `.qoder/rules/` 目录下定义了编码规范，作为 AI 代码生成的**单一可信源**：

| 子项目 | 规则目录 | 核心规范 |
|--------|----------|----------|
| `backend` | `backend/.qoder/rules/` | 模块结构、API 响应格式、异常处理、编码风格 |
| `admin` | `admin/.qoder/rules/` | 项目结构、代码风格、命名规范、API 响应 |
| `native_app` | `native_app/.qoder/rules/` | Feature-first 结构、状态管理、数据模型、网络层、错误处理 |

此外，各子项目还通过 `.agents/skills/` 目录集成了技术栈专属的 Agent Skill，作为代码生成时的实现参考：

| 子项目 | 参考技能 |
|--------|----------|
| `admin` | shadcn、tailwind-design-system、typescript-advanced-types、vite、vercel-react-best-practices、ui-ux-pro-max |
| `backend` | java-springboot |
| `native_app` | flutter-animations、flutter-apply-architecture-best-practices、flutter-implement-json-serialization、flutter-setup-declarative-routing、ui-ux-pro-max |
