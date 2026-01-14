# Navix 登录系统实现计划

## 需求概述

实现用户登录系统，支持多用户权限管理：
- **首页 (Nav导航)** 和 **周刊** 内容由系统管理员维护，其他人只能查看
- **其他顶部分类导航 (Panel)** 和内容由各账号自行维护

---

## 技术选型

推荐使用 **NextAuth.js v5** (即 `next-auth`)：
- ✅ Next.js 官方推荐的认证方案
- ✅ 支持多种登录方式 (账号密码、OAuth、邮箱验证链接)
- ✅ 内置 session 管理
- ✅ 与 Prisma 完美集成

---

## Proposed Changes

### 数据库改动 (Prisma Schema)

#### [MODIFY] [schema.prisma](file:///Users/yan/SynologyDrive/claude%20code/Navix/prisma/schema.prisma)

新增用户相关模型：

```prisma
// 用户表
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String    // 加密后的密码
  role          String    @default("user")  // "admin" | "user"
  panels        Panel[]   // 用户拥有的版块
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

修改 Panel 模型，添加所属用户：

```prisma
model Panel {
  id          String     @id @default(cuid())
  name        String
  icon        String?
  sortOrder   Int        @default(0)
  slug        String?    @unique
  isSystem    Boolean    @default(false)  // 是否为系统版块 (Nav导航)
  userId      String?    // 所属用户 (null 表示系统版块)
  user        User?      @relation(fields: [userId], references: [id])
  categories  Category[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}
```

---

### 新增文件

#### [NEW] NextAuth 配置文件

| 文件 | 说明 |
|------|------|
| `src/lib/auth.ts` | NextAuth 核心配置 |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth API 路由 |
| `src/app/login/page.tsx` | 登录页面 |
| `src/app/register/page.tsx` | 注册页面 |
| `src/components/UserMenu.tsx` | 用户头像/登录状态组件 |
| `src/middleware.ts` | 路由保护中间件 |

---

### 权限控制逻辑

```
┌─────────────────┬─────────────┬─────────────┬─────────────┐
│     资源        │   未登录    │  普通用户   │    管理员   │
├─────────────────┼─────────────┼─────────────┼─────────────┤
│ 首页 (Nav导航)  │   只读 ✅   │   只读 ✅   │  编辑 ✅    │
│ 周刊内容        │   只读 ✅   │   只读 ✅   │  编辑 ✅    │
│ 自己的 Panel    │    ❌       │  编辑 ✅    │  编辑 ✅    │
│ 他人的 Panel    │   只读 ✅   │   只读 ✅   │  编辑 ✅    │
│ 系统设置页面    │    ❌       │   只看自己  │  看全部 ✅  │
└─────────────────┴─────────────┴─────────────┴─────────────┘
```

---

### 现有文件改动

| 文件 | 改动说明 |
|------|----------|
| `TopNav.tsx` | 添加用户登录状态显示、登录/注册按钮 |
| `src/app/api/panels/route.ts` | 添加用户过滤，只返回用户有权限的 panels |
| `src/app/api/categories/route.ts` | 创建分类时关联用户 |
| `src/app/api/sites/route.ts` | 编辑前检查权限 |
| `src/app/settings/page.tsx` | 只显示用户有权限的版块 |

---

## User Review Required

> [!IMPORTANT]
> **登录方式选择**：目前计划使用账号密码登录。如果你希望支持其他方式（如微信扫码、邮箱验证码），请告知，这会影响实现复杂度。

> [!WARNING]
> **数据库迁移**：实施此方案需要运行数据库迁移，现有的 Panel 数据需要决定归属：
> - 是否将现有 Panel (如 "Nav导航"、"工作") 标记为系统版块 (`isSystem = true`)？
> - 还是将它们归属给第一个管理员账号？

---

## 实施步骤

### 阶段一：基础设施 (约 1-2 小时)
1. 安装 `next-auth` 和 `bcryptjs` 依赖
2. 更新 Prisma schema，添加 User 模型
3. 运行数据库迁移
4. 配置 NextAuth

### 阶段二：登录 UI (约 1 小时)
1. 创建登录/注册页面
2. 在 TopNav 添加用户菜单

### 阶段三：权限控制 (约 1-2 小时)
1. 修改 API 路由添加权限校验
2. 创建中间件保护管理页面
3. 前端隐藏/禁用无权限的操作按钮

---

## Verification Plan

### 手动测试

由于这是登录系统，需要人工测试以下场景：

1. **注册流程**
   - 打开 `/register` 页面
   - 填写邮箱、密码，点击注册
   - 验证跳转到首页并显示已登录状态

2. **登录/登出**
   - 点击"退出登录"
   - 重新登录，验证 session 正常

3. **权限验证**
   - 用普通用户登录，验证无法编辑"Nav导航"版块
   - 用管理员登录，验证可以编辑所有内容
   - 未登录状态，验证可以正常浏览但无法编辑

---

## 预计工时

| 阶段 | 预计时间 |
|------|----------|
| 基础设施 | 1-2 小时 |
| 登录 UI | 1 小时 |
| 权限控制 | 1-2 小时 |
| **总计** | **3-5 小时** |
