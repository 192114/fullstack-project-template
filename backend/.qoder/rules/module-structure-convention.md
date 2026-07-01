---
description: 新模块遵循标准分层结构
globs:
  - "**/*.java"
---

# 模块结构规范

新增业务模块时，必须遵循现有的分层目录结构，保持项目一致性。

## 标准目录结构

```
{module}/
├── controller/     # REST 接口层，只做参数校验和调用 Service
├── service/        # 业务接口定义
│   └── impl/       # 业务实现，核心逻辑在此
├── dto/            # 请求参数对象（如 XxxRequest、XxxQuery）
├── entity/         # MyBatis-Plus 实体类，映射数据库表
├── mapper/         # MyBatis-Plus Mapper 接口
├── vo/             # 响应视图对象（View Object），返回给前端的数据
└── response/       # 模块级业务错误码（实现 IResultCode 接口）
```

## 规则

1. Controller 不写业务逻辑，只做参数接收、校验和 Service 调用
2. Service 接口定义在 `service/` 下，实现类放在 `service/impl/` 下
3. 请求参数使用 DTO（`XxxRequest` / `XxxQuery`），响应数据使用 VO（`XxxVO`）
4. Entity 仅用于数据库映射，不直接暴露给前端
5. 模块级错误码实现 `IResultCode` 接口，放在 `response/` 目录下
6. 使用 `@RequiredArgsConstructor` + `final` 字段进行构造器注入，不使用 `@Autowired`
