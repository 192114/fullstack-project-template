# feature-execute

Execute code generation based on feature planning documents created by `/feature-plan`.

## Usage

```
/feature-execute <feature-name>
```

**Example:**
```
/feature-execute user
```

## Prerequisites

The feature planning documents must exist at `docs/{feature-name}/`:
- `requirement.md`
- `api.md`
- `domain.md`
- `ui.md` (only if frontend target was selected)
- `task.md`

If any required document is missing, stop and ask the user to run `/feature-plan {feature-name}` first.

## Instructions

You are a full-stack orchestrator executing code generation from planning documents. Your role is to **read task.md, execute tasks in order, and delegate to sub-project rules** for code conventions.

### Step 1: Load Planning Documents & Determine Targets

1. Read `docs/{feature-name}/task.md` first — extract the `<!-- targets: ... -->` comment or the target list from the header
2. Read the remaining documents based on targets:
   - `requirement.md` — always read
   - `api.md` — always read
   - `domain.md` — always read
   - `ui.md` — only read if a frontend target is in the targets list

If `task.md` does not contain targets metadata, stop and inform the user:
```
task.md 中未找到目标工程信息。请重新运行 /feature-plan {feature-name} 并选择目标工程。
```

### Step 2: Load Sub-Project Rules (MANDATORY)

Before generating any code, you MUST read and internalize the rules from **each selected target** sub-project. These rules are the **single source of truth** for all code conventions.

**Only load rules for the targets specified in task.md.** For example, if only `backend` is a target, skip loading `native_app` rules.

**Backend rules — read ALL files in (only if `backend` is a target):**
```
backend/.qoder/rules/
```
Key rules include: module structure, API response convention, exception handling, coding style, API convention, project structure.

**Backend skills — reference:**
```
backend/.qoder/skills/java-springboot/SKILL.md
```

**Frontend rules — read ALL files in (only if `native_app` is a target):**
```
native_app/.qoder/rules/
```
Key rules include: feature-first structure, feature implementation order, data model conventions, state management, error handling, network layer, import conventions, naming conventions.

**Frontend skills — reference:**
```
native_app/.qoder/skills/flutter-implement-json-serialization/SKILL.md
native_app/.qoder/skills/flutter-apply-architecture-best-practices/SKILL.md
native_app/.qoder/skills/flutter-setup-declarative-routing/SKILL.md
```

**IMPORTANT:** When generating backend code, follow `backend/.qoder/rules/` exclusively. When generating frontend code, follow `native_app/.qoder/rules/` exclusively. Do NOT invent conventions that conflict with these rules.

### Step 3: Execute Backend Tasks

**Only execute this step if `backend` is in the targets list.** Skip entirely if not.

Follow the backend tasks in `task.md` order. For each task:

1. Read the task description and corresponding document section (api.md / domain.md)
2. Generate the code file **following `backend/.qoder/rules/`**
3. Verify the generated code is consistent (check imports, types, package declarations)
4. Mark the task as `[x]` in `task.md`

**Execution order reference** (actual tasks come from task.md):
- Entity → Mapper → DTO/VO → ResultCode → Service (interface + impl) → Controller → Schema update

**Key reminders** (details in sub-project rules):
- All API responses use `Result<T>` wrapper, pagination uses `PageResult<T>`
- Business errors throw `BusinessException` with `IResultCode` enum
- Service layer uses interface + impl pattern
- Schema changes append to `backend/src/main/resources/sql/schema.sql`

### Step 4: Execute Frontend Tasks

**Only execute this step if a frontend target (e.g., `native_app`) is in the targets list.** Skip entirely if not.

Follow the frontend tasks in `task.md` order. For each task:

1. Read the task description and corresponding document section (api.md / ui.md)
2. Generate the code file **following `native_app/.qoder/rules/`**
3. Mark the task as `[x]` in `task.md`

**Execution order reference** (actual tasks come from task.md):
- Model (Freezed) → DataSource → Repository (interface + impl + Provider) → ViewModel → View → Router registration

**Critical workflow constraints:**
- After creating Model files, MUST run: `cd native_app && flutter pub run build_runner build --delete-conflicting-outputs`
- Do NOT proceed to next task until build_runner completes successfully
- Router registration: update `lib/core/router/app_router.dart`

### Step 5: Handle Ambiguity

If any document content is ambiguous or conflicts with sub-project rules:
1. Stop execution
2. Clearly describe the ambiguity or conflict
3. Ask the user for clarification
4. Resume after receiving clarification

### Step 6: Completion Summary

After all tasks are completed, output a summary based on actual targets:
```
功能 [{feature-name}] 代码生成完成！
目标工程: {targets}

后端产出: (仅 backend 在 targets 中时显示)
- [list all generated backend files]

前端产出: (仅 native_app 在 targets 中时显示)
- [list all generated frontend files]

数据库变更:
- schema.sql 已更新

请检查生成的代码并进行测试。
```

## Constraints

- Execute tasks strictly in the order defined in `task.md`
- Do NOT skip any task unless the user explicitly requests it
- Do NOT modify existing code in other modules unless explicitly required
- **All code conventions come from sub-project rules** — this skill only handles orchestration
- If a task fails (e.g., compilation error, build_runner failure), stop and report the issue
