# 代码规范

## 通用规则

1. 使用函数式组件 + Hooks，不使用 Class 组件
2. 组件使用 `function ComponentName()` 声明，不使用箭头函数导出
3. 优先使用 TypeScript 严格模式，避免使用 `any`
4. 使用 `@/` 路径别名进行导入，不使用相对路径（组件内部除外）

## Import 顺序

按以下顺序组织 import 语句：

1. React 相关（react, react-dom）
2. 第三方库（@tanstack/*, react-hook-form, zod, axios 等）
3. 项目内部模块（@/layouts, @/pages, @/components, @/services 等）
4. UI 组件（@/components/ui/*）
5. 类型导入（type imports）
6. 样式文件

## 代码风格

1. 使用单引号，不使用双引号（JSX 属性除外）
2. 使用 2 空格缩进
3. 末尾不加 semicolon 也可以（遵循项目 tsconfig 配置）
4. 组件 props 类型直接使用内联 `React.ComponentProps<>` 或独立 interface
5. 常量使用 `UPPER_SNAKE_CASE`，其余使用 `camelCase`
6. 布尔类型 props 以 `is`/`has`/`should` 开头

## React 最佳实践

1. 使用 `React.memo()` 优化频繁渲染的组件
2. 使用 `useCallback` 和 `useMemo` 优化性能敏感的计算和回调
3. 表单使用 React Hook Form + Zod 校验
4. 异步请求使用 TanStack Query，不直接使用 useEffect + fetch
5. 错误边界使用 ErrorBoundary 组件包裹关键区域
