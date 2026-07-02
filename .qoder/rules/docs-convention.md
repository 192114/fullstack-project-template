# 功能文档规范

所有功能设计文档统一存放于 `docs/{feature-name}/` 目录下，由 `/feature-plan` 自动生成。

## 目录结构

```
docs/
└── {feature-name}/
    ├── requirement.md    # 需求文档（始终生成）
    ├── api.md            # 接口约束文档（始终生成）
    ├── domain.md         # 数据模型文档（始终生成）
    ├── ui.md             # UI 文档（仅前端目标时生成）
    └── task.md           # 执行任务清单（始终生成）
```

## 命名规范

- 功能名称使用小写英文，如 `user`、`order`、`payment`
- 目录名与功能名称一致
- 文档文件名固定，不可自定义

## task.md 元数据

`task.md` 头部必须包含 targets 注释，用于 `/feature-execute` 识别目标工程：

```markdown
<!-- targets: backend,native_app -->
```

## 约束

- 禁止在 `docs/` 以外的目录存放功能设计文档
- 禁止手动删除已生成的文档（如需修改，直接编辑文件内容）
- 文档内容使用中文编写（代码和技术标识符除外）
