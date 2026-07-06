# AA 账单拆分器

一个面向聚餐、旅行和团体消费的账单分摊工具。项目是纯前端单页应用，没有后端接口和数据库，所有账单数据都保存在浏览器内存中，通过分享链接把完整账单状态编码到 URL 里。

## 项目概览

- 适合快速录入账单、参与人、款项、优惠和附加费用
- 支持整单优惠、按人数分摊的费用、按消费比例分摊的费用
- 结算页会生成每个人的应付金额和最终转账关系
- 使用暗色主题，结算页支持打印和导出 PDF
- 已做好基础 SEO、图标、Web App Manifest 和 Cloudflare Worker 部署配置

## 功能

1. 账单基础信息
   - 标题
   - 账单时间，默认取当前本地时间
   - 备注

2. 参与人管理
   - 添加、编辑、删除参与人
   - 每个参与人可填写已付金额
   - 已付金额默认值为 `0.00`

3. 款项录入
   - 添加消费名称和金额
   - 支持“全体参与”
   - 支持“部分参与”并手动勾选参与人

4. 优惠和费用
   - 整单优惠
   - 附加费用
   - 费用支持按人数均分或按消费比例分摊

5. 结算结果
   - 每人原始消费、优惠分摊、费用分摊、最终应付、已付、净额
   - 自动生成转账关系
   - 支持打印和导出 PDF

6. 分享与回放
   - 结算页可生成分享链接
   - 账单状态编码到 `?bill=...`
   - 旧的 `#/review` 链接会自动兼容为干净路径

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS 4
- React Router
- Cloudflare Workers / Wrangler

## 项目结构

```text
BillSplitter/
├── public/                  # favicon、manifest、robots、Web App 图标
├── src/
│   ├── components/          # 通用布局与表单组件
│   ├── lib/                 # 计算、格式化、分享链接等纯函数
│   ├── pages/               # 五个步骤页面
│   ├── router/              # 路由步骤定义
│   ├── state/               # 全局账单状态
│   ├── styles/              # 全局样式
│   ├── App.tsx              # 路由总入口
│   └── main.tsx             # 应用挂载入口
├── index.html               # SEO、OG、Twitter、JSON-LD、图标引用
├── package.json             # 脚本和依赖
├── wrangler.jsonc           # Cloudflare Worker 静态资源配置
└── README.md
```

## 核心模块

- `src/main.tsx`
  - 应用挂载入口
  - 使用 `BrowserRouter`
  - 向后兼容旧的 hash 链接

- `src/App.tsx`
  - 定义整套路由
  - 懒加载页面，减少首屏体积

- `src/components/AppShell.tsx`
  - 全局页面框架
  - 顶部摘要信息
  - 步骤导航
  - 动态更新 title、description、canonical

- `src/components/ui.tsx`
  - 输入框、按钮、卡片、列表、提示条等基础 UI

- `src/components/StepActions.tsx`
  - 上一步 / 下一步 / 结算动作

- `src/lib/engine.ts`
  - 账单计算引擎
  - 负责分摊、误差处理、净额和转账生成

- `src/lib/share.ts`
  - 账单分享编码和解码
  - URL 参数读写

- `src/lib/bill-template.ts`
  - 默认账单状态
  - 本地时间输入默认值

- `src/state/bill-state.tsx`
  - 全局状态容器
  - reducer 驱动的账单编辑状态
  - 提供 `useBill()` 和 `useBillSummary()`

- `src/pages/OverviewPage.tsx`
  - 账单标题、时间、备注

- `src/pages/ParticipantsPage.tsx`
  - 参与人和已付金额

- `src/pages/ItemsPage.tsx`
  - 消费项录入
  - 全体参与 / 部分参与

- `src/pages/AdjustmentsPage.tsx`
  - 优惠和附加费用

- `src/pages/ReviewPage.tsx`
  - 结算明细
  - 分享链接
  - 打印 / 导出 PDF

- `src/types.ts`
  - 账单、参与人、款项、优惠、费用、结算结果的数据类型

## 数据模型

账单状态由 `BillState` 描述，主要包含：

- `meta`
  - `title`
  - `createdAt`
  - `notes`

- `participants`
  - `id`
  - `name`
  - `paidAmountInCents`
  - `active`

- `items`
  - `id`
  - `name`
  - `amountInCents`
  - `scopeType`
  - `participantIds`

- `discounts`
  - `id`
  - `name`
  - `amountInCents`

- `fees`
  - `id`
  - `name`
  - `amountInCents`
  - `allocationMethod`
  - `participantIds`

金额内部统一用“分”处理，避免浮点误差。

## 计算规则

- 仅 `active: true` 的参与人参与结算
- 款项 `scopeType = all` 时，默认由所有有效参与人分摊
- 款项 `scopeType = partial` 时，只在勾选的人之间分摊
- 整单优惠按每个人的原始消费占比分摊
- 附加费用支持：
  - 按人数均分
  - 按消费比例分摊
- 分摊后的余数会分配给一个确定的“锚点参与人”，保证总额精确
- 结算页会把净额转换成具体转账关系

## 路由

路由是标准路径，不使用 hash：

- `/setup`
- `/participants`
- `/items`
- `/adjustments`
- `/review`

`/` 会重定向到 `/setup`。

## SEO 与 Web App

`index.html` 已包含这些内容：

- `description`
- `keywords`
- `robots`
- Open Graph 元标签
- Twitter Card 元标签
- `schema.org/WebApplication` JSON-LD
- 深色主题相关的 `theme-color` 和 `color-scheme`

`public/` 里包含：

- `favicon.ico`
- `favicon.svg`
- `favicon-96x96.png`
- `apple-touch-icon.png`
- `web-app-manifest-192x192.png`
- `web-app-manifest-512x512.png`
- `site.webmanifest`
- `robots.txt`

## 部署

项目通过 Cloudflare Worker 提供静态站点服务，`wrangler.jsonc` 已开启：

- 单页应用回退
- Node.js 兼容标志
- 自定义域名路由

当前配置面向 Cloudflare 的自动部署流程，适合直接接入 GitHub 仓库自动发布，不需要 GitHub Actions。

## 开发与构建

```bash
pnpm dev
pnpm build
pnpm preview
pnpm deploy
```

- `pnpm dev`：本地开发
- `pnpm build`：类型检查并构建生产产物
- `pnpm preview`：本地运行 Worker 预览
- `pnpm deploy`：构建后部署到 Cloudflare

## 说明

- 这是一个前端内存态应用，刷新页面后，未通过分享链接保存的编辑内容不会保留
- 如果后续需要持久化，可以再加 `localStorage` 或后端存储
- 当前结算逻辑已经覆盖了常见的 AA 分摊场景，但复杂退款、发票税率、多币种等还没有纳入
