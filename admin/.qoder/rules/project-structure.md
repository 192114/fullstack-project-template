# 项目结构规范

## 目录结构

```
src/
├── app/                  # 应用入口（main.tsx, router.tsx, queryClient.ts）
├── routes/               # TanStack Router 路由定义（复杂路由拆分时使用）
├── layouts/              # 布局组件（AdminLayout、AuthLayout）
├── pages/                # 页面组件（每个路由对应一个页面）
├── components/
│   ├── ui/               # shadcn/ui 基础组件（禁止手动修改）
│   ├── business/         # 业务通用组件
│   └── charts/           # 图表相关组件
├── features/             # 按业务模块划分的功能目录
│   ├── user/             # 用户管理模块
│   ├── role/             # 角色管理模块
│   ├── health/           # 健康检查模块
│   └── report/           # 报表模块
├── services/
│   ├── api/              # API 接口定义（OpenAPI 自动生成优先）
│   └── request.ts        # Axios 实例与拦截器
├── hooks/                # 自定义 Hooks
├── stores/               # 全局状态管理（如需要）
├── lib/                  # 工具库（cn 函数等）
├── styles/               # 全局样式
├── types/                # 全局 TypeScript 类型定义
└── utils/                # 通用工具函数
```

## 规则

1. **pages/** 只放页面级组件，业务逻辑应抽取到 **features/** 对应模块中
2. **components/ui/** 仅存放 shadcn/ui 组件，不要手动修改这些文件
3. **components/business/** 存放跨模块复用的业务组件
4. **features/** 下的每个模块应包含：api、hooks、components、types 等子目录
5. **types/** 只放全局共享类型，模块私有类型放在各自的 types 目录中
6. 所有文件使用 TypeScript（.tsx / .ts）
7. 样式统一使用 TailwindCSS，不要使用 CSS Modules 或 styled-components
