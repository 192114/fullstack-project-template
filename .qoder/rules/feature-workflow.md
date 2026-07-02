# 功能开发工作流

本项目采用文档驱动的分阶段开发流程，所有新功能必须遵循以下步骤：

## 标准流程

```
/feature-plan → 人工审核 → /feature-execute
```

### 阶段一：规划（/feature-plan）

- 使用 `/feature-plan <feature-name> <description> [--targets=...]` 生成功能设计文档
- 文档输出到 `docs/{feature-name}/` 目录
- 必须指定或选择目标工程（backend、native_app 等）

### 阶段二：审核（人工）

- 用户必须审核生成的所有文档
- 可手动修改文档内容
- 确认无误后才进入执行阶段
- **禁止跳过审核直接执行**

### 阶段三：执行（/feature-execute）

- 使用 `/feature-execute <feature-name>` 按 task.md 顺序生成代码
- 严格遵循子项目 `.qoder/rules/` 下的编码规范
- 每完成一个任务在 task.md 中标记 `[x]`

## 约束

- 禁止未经 plan 阶段直接编写功能代码
- 禁止在审核前执行 execute
- 如需修改已完成的功能，仍需走此流程（可复用已有文档）
