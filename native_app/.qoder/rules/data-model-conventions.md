# 数据模型规范（Freezed）

## 技术方案

使用 **Freezed + JsonSerializable** 定义所有数据模型，禁止手写 `fromJson` / `toJson` 序列化逻辑。

## 标准写法

```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_model.freezed.dart';
part 'user_model.g.dart';

@freezed
class UserModel with _$UserModel {
  const factory UserModel({
    required String id,
    required String name,
    String? email,
    @Default(0) int age,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);
}
```

## 文件约定

每个 Model 文件必须包含三行声明：

```dart
part 'xxx_model.freezed.dart';  // Freezed 生成（copyWith、==、toString）
part 'xxx_model.g.dart';        // JsonSerializable 生成（fromJson、toJson）
```

| 生成文件 | 提供能力 |
|---------|---------|
| `*.freezed.dart` | `copyWith`、`==`、`hashCode`、`toString` |
| `*.g.dart` | `fromJson`、`toJson` |

## 构建命令

**修改 Model 后必须执行：**

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

增量构建（仅重新生成变更的文件）：

```bash
flutter pub run build_runner build
```

监听模式（开发时持续监听变更并自动生成）：

```bash
flutter pub run build_runner watch --delete-conflicting-outputs
```

## 使用规范

- 使用 `copyWith` 更新状态，禁止手动构造新实例来修改单个字段
- `@Default(value)` 为可选字段设置默认值，避免 null 传播
- 枚举字段使用 `@JsonEnum(fieldRename: FieldRename.snake)` 或自定义 `fromJson`/`toJson`
- 嵌套 Model 直接声明类型，Freezed 会自动递归序列化

## 禁止行为

- 禁止手写 `fromJson` / `toJson` 方法（由代码生成替代）
- 禁止在 Model 中添加非 `const` 的可变状态
- 禁止在 Model 中编写业务逻辑方法（Model 只做数据承载）
- 禁止遗漏 `part` 声明导致生成文件缺失
