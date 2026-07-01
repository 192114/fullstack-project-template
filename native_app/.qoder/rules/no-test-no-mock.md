# 禁止测试和 Mock 代码

## 总则

项目中**禁止编写任何测试代码和 Mock 相关代码**，包括但不限于单元测试、集成测试、Widget 测试、Mock 类、Mock 数据。

## 禁止清单

### 文件层面

- 禁止在 `test/` 目录下创建或修改文件
- 禁止在 `lib/` 目录下创建 `*_test.dart`、`*_mock.dart` 文件
- 禁止在 `pubspec.yaml` 的 `dev_dependencies` 中引入测试依赖（如 `mocktail`、`mockito`、`fake_async`）

### 代码层面

- 禁止定义 Mock 类（如 `XxxRepositoryMock`、`MockXxxDataSource`）
- 禁止使用 `@GenerateMocks`、`@GenerateNiceMocks` 等代码生成注解
- 禁止编写 `test()`、`testWidgets()`、`group()` 测试用例
- 禁止使用 `expect()`、`verify()`、`when()` 等断言/Mock API
- 禁止在业务代码中编写仅服务于测试的逻辑（如 `@visibleForTesting` 标注的公开方法）

### 目录结构

- 项目结构中不包含 `test/`、`mock/`、`fakes/` 等测试专用目录
- `features/{feature}/repositories/` 仅包含接口和 `Impl` 实现，不包含 `Mock`
- `core/network/` 不包含 `mock_adapter` 等 Mock 适配层

## 审查要点

Code Review 时检查以下违规项：
- 新增文件中是否存在 `test`、`mock`、`fake`、`stub` 关键词
- `pubspec.yaml` 是否新增了测试相关依赖
- 业务代码中是否引入了仅为测试服务的抽象或接口
