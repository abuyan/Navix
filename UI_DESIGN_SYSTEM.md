# Navix UI 设计系统文档

本文档记录了 Navix 项目的 UI 组件、配色方案和设计规范，供后续开发参考。

---

## 1. 配色系统

### 1.1 浅色模式 (Notion Style)

| 变量名 | 值 | 用途 |
|--------|-----|------|
| `--color-bg-primary` | `#ffffff` | 主背景色 |
| `--color-bg-secondary` | `#ffffff` | 次级背景色（卡片等） |
| `--color-bg-tertiary` | `#f7f7f5` | 第三级背景（输入框、按钮底色） |
| `--color-text-primary` | `#1a1a1a` | 主文字颜色 |
| `--color-text-secondary` | `#5f5e5b` | 次级文字（描述、标签） |
| `--color-text-tertiary` | `#9b9a97` | 第三级文字（提示、占位符） |
| `--color-border` | `rgba(0, 0, 0, 0.08)` | 默认边框 |
| `--color-border-hover` | `rgba(0, 0, 0, 0.14)` | 悬停边框 |
| `--color-accent` | `#1a1a1a` | 强调色 |
| `--color-accent-soft` | `rgba(0, 0, 0, 0.05)` | 柔和强调色背景 |
| `--color-action-bg` | `#f7f7f5` | 操作按钮背景 |
| `--color-action-hover` | `#e5e7eb` | 操作按钮悬停背景 |

### 1.2 深色模式 (Linear Style)

| 变量名 | 值 | 用途 |
|--------|-----|------|
| `--color-bg-primary` | `#08090a` | 主背景色 |
| `--color-bg-secondary` | `#0d0e10` | 次级背景色 |
| `--color-bg-tertiary` | `#151618` | 第三级背景 |
| `--color-text-primary` | `#d0d6e0` | 主文字颜色 |
| `--color-text-secondary` | `#8a8b8d` | 次级文字 |
| `--color-text-tertiary` | `#606163` | 第三级文字 |
| `--color-border` | `rgba(255, 255, 255, 0.08)` | 默认边框 |
| `--color-border-hover` | `rgba(255, 255, 255, 0.14)` | 悬停边框 |
| `--color-accent` | `#ffffff` | 强调色 |
| `--color-accent-soft` | `rgba(255, 255, 255, 0.08)` | 柔和强调色 |
| `--color-action-bg` | `#151618` | 操作按钮背景 |
| `--color-action-hover` | `#2a2b2d` | 操作按钮悬停背景 |

### 1.3 阴影系统

| 变量名 | 浅色模式 | 深色模式 |
|--------|----------|----------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.5)` |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.05)` | `0 4px 6px -1px rgba(0,0,0,0.6)` |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.05)` | `0 10px 15px -3px rgba(0,0,0,0.7)` |
| `--shadow-card-hover` | `0 20px 25px -5px rgba(0,0,0,0.05)` | `0 20px 25px -5px rgba(0,0,0,0.8)` |

---

## 2. 字体系统

```css
font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

---

## 3. 组件库

### 3.1 模态框 (Modal)

| 组件 | 用途 | 文件 |
|------|------|------|
| `CategoryEditModal` | 分类编辑/新建 | `src/components/CategoryEditModal.tsx` |
| `SiteEditModal` | 站点编辑/新建 | `src/components/SiteEditModal.tsx` |
| `PanelModal` | 版块编辑/新建 | `src/components/PanelModal.tsx` |
| `ConfirmModal` | 确认操作弹窗 | `src/components/ConfirmModal.tsx` |
| `ImportModal` | 书签导入 | `src/components/ImportModal.tsx` |

**通用样式规范：**
```tsx
// 模态框容器
className="fixed inset-0 z-[100] flex items-center justify-center"
style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}

// 模态框卡片
className="w-full max-w-md rounded-xl shadow-2xl"
style={{
  backgroundColor: 'var(--color-bg-secondary)',
  border: '1px solid var(--color-border)'
}}

// 标题栏高度
height: '60px'
borderBottom: '1px solid var(--color-border)'

// 内容区域
className="p-6 space-y-6"
```

### 3.2 按钮样式

**主要按钮（保存、确认）：**
```tsx
className="px-6 h-9 rounded-lg font-medium"
style={{
  backgroundColor: 'var(--color-text-primary)',
  color: 'var(--color-bg-primary)'
}}
```

**次要按钮（取消）：**
```tsx
className="px-6 h-9 rounded-lg font-medium"
style={{
  backgroundColor: 'var(--color-action-bg)',
  color: 'var(--color-text-secondary)'
}}
```

**图标按钮：**
```tsx
className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
```

### 3.3 表单元素

**输入框：**
```tsx
className="w-full px-4 h-9 rounded-lg border outline-none text-sm"
style={{
  backgroundColor: 'var(--color-bg-tertiary)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)'
}}
```

**自定义下拉选择器：**
```tsx
// 触发器
className="w-full px-3 h-9 rounded-lg border cursor-pointer flex items-center justify-between"

// 下拉菜单
className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg shadow-xl border"
style={{
  backgroundColor: 'var(--color-bg-secondary)',
  borderColor: 'var(--color-border)',
  maxHeight: '200px',
  overflowY: 'auto'
}}

// 选项项
className="px-4 py-2 text-sm cursor-pointer transition-colors"
// 选中时: backgroundColor: 'var(--color-accent-soft)', color: 'var(--color-accent)'
// 悬停时: backgroundColor: 'var(--color-bg-tertiary)'
```

### 3.4 卡片组件

**站点卡片 (SiteCard)：**
```tsx
className="card-glow relative flex flex-col gap-3 p-4 rounded-lg"
style={{
  backgroundColor: 'var(--color-bg-secondary)',
  border: '1px solid var(--color-border)',
  boxShadow: isHovered ? 'var(--shadow-card-hover)' : 'none'
}}
```

### 3.5 布局组件

| 组件 | 用途 |
|------|------|
| `TopNav` | 顶部导航（版块切换、搜索、主题切换） |
| `Sidebar` | 左侧边栏（分类导航） |
| `ClientWrapper` | 主页面布局容器 |
| `PageToolbar` | 页面工具栏（新增分类、导入、排序） |

### 3.6 周刊相关

| 组件 | 用途 |
|------|------|
| `WeeklySidebar` | 周刊侧边栏 |
| `MarkdownRenderer` | Markdown 渲染 |
| `TableOfContents` | 文章目录 |

---

## 4. 图标库

使用 **Lucide React** 图标库：
```tsx
import { Plus, Edit, Trash2, ChevronDown, ... } from 'lucide-react';
```

常用图标尺寸：
- 小图标：`size={14}` (操作按钮)
- 中图标：`size={18}` (导航、列表)
- 大图标：`size={20}` (标题、弹窗)

---

## 5. 动画效果

### 5.1 卡片 3D 倾斜效果
```tsx
transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
```

### 5.2 过渡动画
```css
transition-colors duration-200
transition-all duration-300
animate-in fade-in zoom-in duration-150
```

### 5.3 搜索高亮动画
```css
.search-highlight {
  animation: search-highlight 1s ease-in-out 2;
}
```

---

## 6. 响应式断点

| 断点 | 宽度 |
|------|------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

**侧边栏折叠：**
- 展开宽度：`w-64` (256px)
- 折叠宽度：`w-[72px]` (72px)

---

## 7. 使用规范

### 7.1 颜色使用
- 始终使用 CSS 变量而非硬编码颜色
- 使用 `var(--color-xxx)` 格式

### 7.2 样式写法
```tsx
// 推荐：使用 style 对象应用 CSS 变量
style={{ 
  backgroundColor: 'var(--color-bg-tertiary)',
  color: 'var(--color-text-primary)' 
}}

// 推荐：使用 Tailwind 类名结合 CSS 变量
className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
```

### 7.3 主题适配
- 深色模式通过 `html.dark` 类名切换
- 组件应自动适配两种主题
- 使用 `ThemeToggle` 组件切换主题

---

*最后更新：2026-01-14*
