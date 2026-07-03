# 禁止生成测试代码

## 规则

1. **不要**自动生成任何测试文件（.test.ts, .test.tsx, .spec.ts, .spec.tsx）
2. **不要**创建 __tests__ 目录
3. **不要**在代码中包含 test/it/describe/expect 等测试框架语法
4. **不要**安装测试相关依赖（jest, vitest, @testing-library 等），除非用户明确要求
5. **不要**生成 mock 文件或 fixture 文件

## 例外

仅当用户**明确要求**添加测试时，才可以生成测试代码。
