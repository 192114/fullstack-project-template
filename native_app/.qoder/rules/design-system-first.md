---
description: Flutter UI 开发时优先使用项目设计系统常量
globs: **/lib/**/*.dart
alwaysApply: false
---

# 设计系统优先规则

## 强制要求

编写 Flutter UI 代码时，**必须优先使用**项目设计系统中定义的常量，禁止直接写绝对值。

## 设计系统常量

| 类别 | 类名 | 路径 | 用途 |
|------|------|------|------|
| 颜色 | `AppColors` | `config/theme/app_colors.dart` | 所有颜色值 |
| 字号/字重 | `AppTypography` | `config/theme/app_typography.dart` | TextStyle |
| 间距/Padding | `AppSpacing` | `config/theme/app_spacing.dart` | 间距、边距 |
| 圆角 | `AppRadius` | `config/theme/app_radius.dart` | 圆角半径 |

## 示例

### 正确 ✅

```dart
// 颜色
color: AppColors.primary
decorationColor: AppColors.error

// 间距
padding: EdgeInsets.all(AppSpacing.lg)
SizedBox(height: AppSpacing.md)
margin: EdgeInsets.symmetric(horizontal: AppSpacing.pageHorizontal)

// 圆角
borderRadius: BorderRadius.circular(AppRadius.card)
borderRadius: BorderRadius.circular(AppRadius.button)

// 文字样式
style: AppTypography.bodyLarge
style: AppTypography.titleMedium
```

### 错误 ❌

```dart
// 禁止硬编码颜色
color: Color(0xFF6750A4)
color: Colors.blue

// 禁止硬编码间距
padding: EdgeInsets.all(16)
SizedBox(height: 12)

// 禁止硬编码圆角
borderRadius: BorderRadius.circular(12)

// 禁止硬编码文字样式
style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)
```

## 设计系统中没有需要的值时

**禁止直接使用绝对值**。必须先将新值添加到对应的设计系统类中，再从类中引用。

### 流程

1. 在对应的设计系统类中添加新常量
2. 在 UI 代码中使用该常量

### 示例

需要一个新的间距值 `40`：

```dart
// 第一步：在 AppSpacing 中添加
class AppSpacing {
  // ... 已有常量
  /// 40px - 特大间距
  static const double xxxxxl = 40;
}

// 第二步：在 UI 中使用
SizedBox(height: AppSpacing.xxxxxl)
```

需要一个新的圆角值：

```dart
// 第一步：在 AppRadius 中添加
class AppRadius {
  // ... 已有常量
  /// 顶部导航栏圆角
  static const double appBar = 32;
}

// 第二步：在 UI 中使用
borderRadius: BorderRadius.circular(AppRadius.appBar)
```

### 唯一例外

仅当值是**一次性使用**且**来自设计稿的特殊尺寸**（如图片固定宽高）时，才允许直接使用绝对值，并添加注释说明：

```dart
// 图片固定尺寸，来自设计稿，仅此处使用
width: 137,
height: 89,
```
