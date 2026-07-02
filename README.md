# Fullstack Project Template

全栈项目模板，包含后端、前端和基础设施，支持通过 AI Skill 驱动的功能开发工作流。

## 项目结构

```
├── backend/          # Spring Boot 后端服务
├── native_app/       # Flutter 移动端应用
├── infra/            # 基础设施 (Docker Compose)
└── docs/             # 功能规划文档 (由 /feature-plan 生成)
```

### 技术栈

| 模块 | 技术栈 |
|------|--------|
| **backend** | Spring Boot 3 + MyBatis-Plus + Sa-Token + MySQL 8.4 |
| **native_app** | Flutter + Riverpod + Freezed + GoRouter + Dio |
| **infra** | Docker Compose (MySQL 8.4 + Redis 7.4) |

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

### 3. 启动前端

```bash
cd native_app
flutter run
```

## AI Skill 工作流

本项目内置了两个 Qoder Skill，实现文档驱动的全栈功能开发。

### /feature-plan — 功能规划

生成功能的设计文档集（需求、API、数据模型、UI、任务清单）。

```
/feature-plan <feature-name> <feature-description> [--targets=<target1>,<target2>]
```

**示例：**

```bash
# 自动选择目标工程（会弹出多选提示）
/feature-plan user 用户体系，包含登录、注册、修改密码

# 指定目标工程
/feature-plan user 用户体系 --targets=backend,native_app

# 仅后端
/feature-plan order 订单模块 --targets=backend
```

**生成文档：**

| 文件 | 说明 | 生成条件 |
|------|------|----------|
| `docs/{feature}/requirement.md` | 需求文档 | 始终生成 |
| `docs/{feature}/api.md` | 接口约束文档 | 始终生成 |
| `docs/{feature}/domain.md` | 数据模型文档 | 始终生成 |
| `docs/{feature}/ui.md` | UI 文档 | 仅前端目标时生成 |
| `docs/{feature}/task.md` | 执行任务清单 | 始终生成 |

### /feature-execute — 功能执行

根据 `/feature-plan` 生成的文档，按任务清单顺序生成代码。

```
/feature-execute <feature-name>
```

**示例：**

```bash
/feature-execute user
```

**执行逻辑：**
1. 读取 `docs/{feature}/task.md` 中的目标工程和任务列表
2. 加载对应子项目的 rules（单一可信源）
3. 按任务顺序依次生成代码
4. 每完成一个任务标记为 `[x]`

### 开发流程

```
/feature-plan user 用户体系 --targets=backend,native_app
    ↓
生成 docs/user/ 下的设计文档
    ↓
人工审核、修改文档
    ↓
/feature-execute user
    ↓
按 task.md 顺序生成后端 + 前端代码
```

## 子项目规范

每个子项目在各自的 `.qoder/rules/` 目录下定义了编码规范，作为代码生成的**单一可信源**：

- `backend/.qoder/rules/` — 后端编码规范（模块结构、API 响应、异常处理等）
- `native_app/.qoder/rules/` — 前端编码规范（分层结构、状态管理、数据模型等）
