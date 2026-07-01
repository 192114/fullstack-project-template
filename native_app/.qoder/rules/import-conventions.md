# Import 路径规范

## 总则

- **同模块内**：使用**相对路径**（`./` 或 `../`）
- **跨模块**：使用**绝对路径**（`package:项目名/...`）

## 同模块 — 相对路径

同一 `features/{feature}/` 内部、或同一 `core/` 子目录内部的文件互相引用时，使用相对路径：

```dart
// features/auth/repositories/auth_repository_impl.dart
import '../models/user_model.dart';
import '../datasources/auth_remote_datasource.dart';

// features/auth/view/login_page.dart
import '../view_model/login_notifier.dart';
import 'widgets/login_form.dart';
```

## 跨模块 — 绝对路径

引用其他 feature 模块、`core/` 模块、或 `app/` 模块时，使用 `package:` 绝对路径：

```dart
// features/auth/view_model/login_notifier.dart
import 'package:native_app/core/network/api_client.dart';
import 'package:native_app/core/storage/token_storage.dart';
import 'package:native_app/features/user/models/user_model.dart';

// core/network/api_client.dart
import 'package:native_app/core/config/app_config.dart';
```

## 判断规则

```
引用文件与被引用文件是否在同一个顶层目录下？
├── 是（同在 features/auth/ 或同在 core/network/）→ 相对路径
└── 否（features/auth/ 引用 core/ 或 features/user/）→ 绝对路径
```

## 禁止行为

- 禁止同模块内使用绝对路径引用同层级文件（如 `import 'package:native_app/features/auth/models/user_model.dart'` 写在 `features/auth/repositories/` 下）
- 禁止跨模块使用相对路径（如 `import '../../../core/network/api_client.dart'`）
- 禁止使用 `import 'package:native_app/main.dart'` 引用启动文件
