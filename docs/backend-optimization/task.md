# backend-optimization - 执行任务清单

<!-- targets: backend -->

## 目标工程

- [x] backend (Spring Boot)

## 后端任务 (Spring Boot)

按以下顺序执行，每个任务完成后标记为 [x]。执行前必须先读取 `backend/.qoder/rules/` 全部规则；测试一律 JUnit5 + Mockito（`@ExtendWith(MockitoExtension.class)`），禁止 `@SpringBootTest`。

### 阶段一：公共基础与错误契约

- [x] **Task B1: 扩展错误码并增强全局异常处理**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/response/AuthResultCode.java`（新增 10022~10025）
  - 文件: `backend/src/main/java/com/shadow/backend/admin/auth/response/AdminResultCode.java`（新增 20103、20104、20204~20206、20304、20305）
  - 文件: `backend/src/main/java/com/shadow/backend/common/exception/GlobalExceptionHandler.java`
  - 变更: 新增 `DuplicateKeyException`/`DataIntegrityViolationException` 处理器，映射 HTTP 200 + `code:409`（沿用 `ResultCode.CONFLICT`）；`resolveValidationMessage` 对非字段校验类异常（如 `HttpMessageNotReadableException`）不再透出底层异常原文，返回统一"请求参数错误"
  - 依赖: 无

- [x] **Task B2: 收紧生产配置并增加启动校验**
  - 文件: `backend/src/main/resources/application.yaml`（新增 `app.security.*`、`app.sms.daily-limit` 配置项）
  - 文件: `backend/src/main/resources/application-prod.yaml`（CORS origins 环境变量化，prod 不默认 `*`；数据库/Redis 口令保持环境变量注入）
  - 文件: `backend/src/main/java/com/shadow/backend/common/config/SecurityProperties.java`（新增，`@ConfigurationProperties(prefix="app.security")` + `@Validated`）
  - 变更: prod profile 下启动校验 `DB_PASSWORD`、`REDIS_PASSWORD`、`ADMIN_INITIAL_PASSWORD`、CORS origins 非空，缺失时抛异常终止启动；新增 `trusted-proxy`（默认 false）与 `initial-admin-password` 属性
  - 依赖: 无

### 阶段二：安全加固

- [x] **Task B3: 管理端路由级权限校验**
  - 文件: `backend/src/main/java/com/shadow/backend/common/config/SaTokenConfigure.java`
  - 变更: admin 拦截器 handle 内用 `SaRouter` 按路由做权限匹配（映射表见 `docs/backend-optimization/api.md` 第一节），无权限时由既有 `NotPermissionException` 处理返回 403；`/api/admin/auth/**`、`/api/admin/menus/tree` 仅登录不校验权限
  - 依赖: 无（可与 B1 并行）

- [x] **Task B4: 防越权与超管保护**
  - 文件: `backend/src/main/java/com/shadow/backend/admin/adminuser/service/impl/AdminUserManageServiceImpl.java`
  - 变更:
    1. `assignRoles`：roleIds 去重；校验角色存在且启用（20204）；目标角色集合必须是操作者自身角色子集（20205）；禁止修改自己的角色（20304）
    2. 最后超管保护：`update`（禁用）、`delete`、`assignRoles`（移除 support）三种路径均校验操作后系统仍存在启用的 `support` 角色管理员，否则拒绝（20305）
    3. 禁用/删除管理员成功后调用 `StpAdminUtil.stpLogic.logout(adminId)` 撤销其全部会话
  - 测试: 扩展 `backend/src/test/java/com/shadow/backend/admin/adminuser/service/impl/AdminUserManageServiceImplTest.java`（越权、自改角色、最后超管、会话撤销各分支）
  - 依赖: B1

- [x] **Task B5: 治理默认管理员初始化**
  - 文件: `backend/src/main/java/com/shadow/backend/admin/auth/config/AdminUserInitializer.java`
  - 变更: 口令改为读 `SecurityProperties.initialAdminPassword`（dev 默认 `admin123`，prod 来自环境变量 `ADMIN_INITIAL_PASSWORD`，缺失由 B2 启动校验拦截）；日志仅输出用户名，不输出明文口令
  - 测试: 新增 `backend/src/test/java/com/shadow/backend/admin/auth/config/AdminUserInitializerTest.java`（已存在跳过、首次创建、口令来源分支）
  - 依赖: B2

- [x] **Task B6: 短信验证码安全加固**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/service/impl/SmsServiceImpl.java`
  - 文件: `backend/src/main/java/com/shadow/backend/auth/service/impl/LogSmsSender.java`（改为 `@Profile("dev")`）
  - 文件: `backend/src/main/java/com/shadow/backend/auth/service/impl/UnconfiguredSmsSender.java`（新增，`@Profile("prod")`，发送时抛 10025）
  - 变更:
    1. 验证码生成改用 `SecureRandom`
    2. `verifyCode` 比较与删除改为 Lua 原子脚本（`DefaultRedisScript` 内联）；新增错误计数键 `sms:attempt:{scene}:{phone}`，达 5 次删除验证码键（10022）
    3. `sendCode` 新增每日上限 `sms:daily:{phone}`（默认 10 次/天，10023）
    4. `SmsLog.code` 写入固定掩码；日志不输出验证码明文
  - 测试: 扩展 `backend/src/test/java/com/shadow/backend/auth/service/impl/SmsServiceImplTest.java`（原子核销调用、错误次数上限、每日上限、掩码写入）
  - 依赖: B1, B2

- [x] **Task B7: Token 生命周期治理**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/service/impl/TokenServiceImpl.java`
  - 文件: `backend/src/main/java/com/shadow/backend/auth/service/impl/AuthServiceImpl.java`
  - 文件: `backend/src/main/java/com/shadow/backend/user/service/impl/UserServiceImpl.java`
  - 变更:
    1. Refresh Token 绑定从账号级 Session 迁移到 Token-Session（`StpAppUtil.getTokenSession()`），退出仅撤销当前设备
    2. `refreshToken` 改用 Redis `GETDEL` 原子取走，并发刷新仅一个成功
    3. 新增用户级撤销注册表 `auth:refresh:user:{userId}`（Set）与 `revokeUserTokens(userId)` 方法：删除全部 refresh 键并 `StpAppUtil.stpLogic.logout(userId)`
    4. `AuthServiceImpl.refresh` 刷新前复核账号审核状态与禁用状态；`resetPassword` 成功后调用 `revokeUserTokens`
    5. `UserServiceImpl.update`（禁用）/`delete` 成功后调用 `revokeUserTokens`
  - 测试: 扩展 `TokenServiceImplTest`、`AuthServiceImplTest`（原子轮换、设备级退出、重置密码撤销、禁用撤销、刷新状态复核分支）
  - 依赖: B1

- [x] **Task B8: 审核状态查询收敛与限流**
  - 文件: `backend/src/main/java/com/shadow/backend/auth/vo/AuditStatusVO.java`（仅保留 `auditStatus`、`phone`）
  - 文件: `backend/src/main/java/com/shadow/backend/auth/service/impl/AuthServiceImpl.java`（`getAuditStatus` 增加同手机号 60 秒查询频率限制，10024；脱敏逻辑改用 `PhoneMaskUtil`）
  - 测试: 扩展 `AuthServiceImplTest`（限流分支、字段收敛）
  - 依赖: B1

- [x] **Task B9: RBAC 停用角色过滤与初始化幂等化**
  - 文件: `backend/src/main/java/com/shadow/backend/admin/menu/mapper/SysMenuMapper.java`（`selectMenusByUserId`、`selectPermissionsByUserId` 两条 SQL 补充 `INNER JOIN sys_role r ... AND r.status = 1 AND r.deleted = 0`，与 `SysRoleMapper.selectRoleCodesByUserId` 规则对齐）
  - 文件: `backend/src/main/java/com/shadow/backend/admin/rbac/RbacDataInitializer.java`（菜单改为按 permission/name 逐条判断存在后插入，中途失败重跑可补全；超管角色关联改为补齐缺失菜单；关联插入捕获唯一键冲突容忍并发实例）
  - 依赖: 无

### 阶段三：数据正确性与并发防护

- [x] **Task B10: 审核状态机与并发防护**
  - 文件: `backend/src/main/java/com/shadow/backend/user/dto/AuditUserRequest.java`（`auditStatus` 增加 `@Range(min=1, max=2)`，消息中文）
  - 文件: `backend/src/main/java/com/shadow/backend/user/service/impl/UserServiceImpl.java`
  - 变更:
    1. `audit` 改为条件更新（`LambdaUpdateWrapper` 限定 `audit_status=0`），影响行数为 0 抛 10019，防并发重复审核
    2. `AuthServiceImpl.resubmit` 的驳回信息置空改为显式 SET NULL（`UpdateWrapper.set(AuditRemark, null)` 等），修复 null 不落库问题
    3. `update`/`updateProfile` 改为选择性字段更新，消除读-改-写覆盖
  - 测试: 扩展 `UserServiceImplTest`（非法状态值、并发条件更新、置空落库、选择性更新）
  - 依赖: B1

- [x] **Task B11: 菜单与关联完整性校验**
  - 文件: `backend/src/main/java/com/shadow/backend/admin/menu/service/impl/MenuServiceImpl.java`
  - 文件: `backend/src/main/java/com/shadow/backend/admin/role/service/impl/RoleServiceImpl.java`
  - 变更:
    1. `create`/`update` 校验 parentId：0 或存在且未删除（20103），且不得指向自身或其后代（20104，沿父链上溯判环）
    2. `assignMenus`：menuIds 去重并校验存在性（20206）
  - 测试: 新增 `backend/src/test/java/com/shadow/backend/admin/menu/service/impl/MenuServiceImplTest.java`（父节点不存在、自环、后代环、正常分支）；扩展 `RoleServiceImplTest`（无效菜单ID、去重）
  - 依赖: B1

- [x] **Task B12: 分页容量统一**
  - 文件: `backend/src/main/java/com/shadow/backend/admin/role/controller/RoleController.java`
  - 文件: `backend/src/main/java/com/shadow/backend/admin/adminuser/controller/AdminUserManageController.java`
  - 变更: 类加 `@Validated`，`current` 加 `@Min(1)`、`size` 加 `@Min(1) @Max(100)`，消息中文；越界走既有 400 处理
  - 依赖: 无

### 阶段四：工程质量

- [x] **Task B13: 代码风格清理**
  - 文件: `backend/src/main/java/com/shadow/backend/admin/adminuser/service/impl/AdminUserManageServiceImpl.java`（弃用 API `selectBatchIds` → `selectByIds`；内联 `java.util.HashMap` 改导入）
  - 文件: `backend/src/main/java/com/shadow/backend/common/util/LoginUserUtil.java`（移除同包冗余 import）
  - 变更: 执行 `./gradlew compileJava -Dorg.gradle.warning.mode=all` 复查弃用告警，全量清零
  - 依赖: 无（实现任务冲突小，可随时执行）

- [x] **Task B14: 日志脱敏与管理操作审计**
  - 文件: `backend/src/main/java/com/shadow/backend/common/util/PhoneMaskUtil.java`（新增，统一脱敏，替换各处散落的 `maskPhone`）
  - 文件: `backend/src/main/java/com/shadow/backend/common/aspect/RequestLogAspect.java`（`resolveClientIp` 仅在 `trusted-proxy=true` 时信任 `X-Forwarded-For`/`X-Real-IP`）
  - 文件: `backend/src/main/java/com/shadow/backend/common/filter/TraceIdFilter.java`（入参 traceId 长度 ≤32 与字符白名单校验，不合法则重新生成）
  - 文件: `backend/src/main/java/com/shadow/backend/admin/audit/entity/OperationLog.java`、`backend/src/main/java/com/shadow/backend/admin/audit/mapper/OperationLogMapper.java`（新增，结构见 domain.md）
  - 文件: `backend/src/main/java/com/shadow/backend/admin/audit/aspect/OperationLogAspect.java`（新增，切 admin Controller 的 POST/PUT/DELETE，记录脱敏参数、结果码、IP、耗时、traceId；记录失败仅告警不影响主流程）
  - 文件: `backend/src/main/resources/sql/schema.sql`、`backend/src/main/resources/sql/operation_log_migration.sql`（新增 `sys_operation_log` 建表，见 domain.md）
  - 变更: `AuthServiceImpl`/`UserServiceImpl` 等日志中的手机号统一经 `PhoneMaskUtil` 脱敏
  - 依赖: B2（trusted-proxy 配置）

- [x] **Task B15: 菜单迁移脚本幂等化**
  - 文件: `backend/src/main/resources/sql/menu_migration.sql`
  - 变更: 重写为幂等脚本（`INSERT ... SELECT ... WHERE NOT EXISTS`），不再 `DELETE FROM sys_menu`/`sys_role_menu` 全量清空；已有角色授权保留，仅补缺失菜单与超管关联；文件头注明"可重复执行"
  - 依赖: 无

- [x] **Task B16: README 与 API 契约一致性修正**
  - 文件: `backend/README.md`
  - 变更: 修正"HTTP 状态码与 code 保持一致"的表述（业务异常为 HTTP 200 + code，鉴权/权限为 HTTP 401/403，唯一键冲突为 409）；补充管理端权限校验说明、prod 必需环境变量清单（`DB_PASSWORD`/`REDIS_PASSWORD`/`ADMIN_INITIAL_PASSWORD`/CORS）、验证码频控规则、审计日志说明
  - 依赖: B3, B5, B6, B14

- [x] **Task B17: 全量回归验证**
  - 命令: `backend` 目录执行 `./gradlew build`
  - 验收: 最终 18 个测试类共 256 个测试全部通过；生产编译无弃用告警，Checkstyle main/test 均零违规；管理员测试类仍有泛型 captor 的 unchecked 编译提示，不影响构建；已核对变更范围，保留工作树原有及并行 admin 工程变更
  - 依赖: B1~B16

- [x] **Task B18: CI 静态检查与依赖漏洞告警**
  - 文件: `backend/build.gradle`（引入 `checkstyle` 插件，接入 `check` 任务）
  - 文件: `backend/config/checkstyle/checkstyle.xml`（新增，最小规则集：命名规范、未使用导入、冗余导入等低争议项，不做格式重排）
  - 文件: `.github/dependabot.yml`（新增，gradle 与 github-actions 两个 ecosystem，周频率）
  - 变更: 确认 `.github/workflows/backend-ci.yml` 无需修改（`./gradlew build` 自动包含 checkstyle）
  - 依赖: B13（先清理存量问题再上门禁）

### 回归发现的目标内修正

- [x] **B4/B5/B7/B17 回归修正**
  - `AdminUserManageServiceImpl`：在读取账号快照前锁定 support 角色行，串行化禁用/删除/角色变更，防止两个超管并发操作绕过最后超管保护。
  - `AdminUserInitializer` / `AdminUserMapper`：用户名存在性查询包含逻辑删除记录；仅容忍经复查确认的同名初始化竞争，不恢复历史账号。
  - `TokenServiceImpl`：Lua 原子轮换并维护注册表，原子删除用户全部 refresh；创建 access 会话后复查 refresh 是否已撤销，防止刷新与撤销交错后重新签发。
  - `LoginAttemptGuard`：按 domain.md 约定将失败计数与首次 TTL 设置合并为 Lua 原子操作。
  - 日志回归：代理头首项为空或 unknown 时回退，不中断请求；全局异常日志不再记录异常消息或 cause，仅保留类型、栈位置和业务码，防止异常文本携带敏感值。
  - 验证：增加单元测试并重新执行 `./gradlew build`，256 个测试全部通过；未启动真实数据库/Redis，菜单脚本仅做内存逻辑验证，未完成真实并发与迁移集成验证。
  - 当前边界：权限委派子集限制、多实例菜单初始化唯一约束、匿名查询防枚举与防篡改审计不在本次已批准实现细则内，详见 `backend/README.md`；Dependabot 安全告警还依赖 GitHub 仓库设置，未修改远端配置。
