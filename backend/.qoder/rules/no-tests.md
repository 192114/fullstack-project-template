---
description: 禁止编写测试相关代码
globs:
  - "**/*.java"
  - "**/*.kt"
  - "**/*.groovy"
---

# 禁止编写测试相关代码

在本项目中，**严禁**编写任何与测试相关的代码，包括但不限于：

- 单元测试（Unit Test）
- 集成测试（Integration Test）
- 端到端测试（E2E Test）
- 测试工具类、测试基类、Mock 对象
- `@Test`、`@SpringBootTest`、`@MockBean` 等测试注解的使用

## 具体要求

1. **不要**在 `src/test/` 目录下创建或修改任何文件
2. **不要**在 `src/main/` 目录下编写测试相关代码
3. **不要**引入测试相关的依赖（如 JUnit、Mockito、AssertJ 等），除非 `build.gradle` 中已存在
4. 如果用户要求编写测试，应明确拒绝并说明项目规则不允许编写测试代码
