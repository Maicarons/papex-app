# papex-app 完整规划（移动端）

> 版本：v0.1（草案，待审阅）
> 日期：2026-08-18
> 定位：Papex 学术文献平台的官方移动端 App，Android / HarmonyOS / iOS 三端一套代码
> 上游依赖：`github.com/Maicarons/papex`（Next.js API + PostgreSQL 后端）
> 技术栈主线：**React Native 0.82 + RNOH 0.82.30（鸿蒙适配）**

---

## 1. 项目概述

### 1.1 定位与目标

- **一句话定位**：Papex 网页版的移动端替代品——在路上、在实验室、在碎片时间，随手读论文、管账号。
- **目标用户**：已注册 papex 的研究者/学生；主要场景是**消费**（读、收藏、追更）而非生产（投稿、审核走网页/桌面端）。
- **核心价值**：
  1. 手机通知栏推送新论文/工单回复（网页版做不到）；
  2. PDF 离线下载，通勤/飞行时也能读；
  3. 指纹/面容一键登录，账号与设备管理随手可及。
- **明确不做（V1）**：投稿上传、管理后台、协审工作流、PDF 批注编辑（仅查看高亮）。

### 1.2 三端支持策略

| 平台 | 方案 | 说明 |
|---|---|---|
| Android | RN 官方支持 | minSdk 24+，Google Play + 国内商店 |
| iOS | RN 官方支持 | iOS 15+，App Store |
| HarmonyOS | RNOH 0.82.30 | 鸿蒙 Next（API 12+），华为 AppGallery |

三端共享约 95% 业务代码；平台差异集中在：安全存储实现、推送通道、深色模式细节、上架配置。

---

## 2. 技术栈（明细）

| 层 | 选型 | 版本/说明 |
|---|---|---|
| 框架 | React Native | **0.82.x**（New Architecture 为唯一架构） |
| 鸿蒙适配 | RNOH | **0.82.30**（2026-05 正式发布，RNOH 与 RN 版本矩阵匹配） |
| 语言 | TypeScript | 5.x strict |
| 导航 | React Navigation | v7（native-stack + bottom-tabs） |
| 状态管理 | Zustand | 与网页端一致 |
| 网络 | 自研 API client（fetch 封装） | 参考 `packages/shared` 设计，从 OpenAPI 生成类型 |
| 数据缓存/离线 | MMKV（kv）+ 原生文件存储（PDF） | MMKV 高性能、同步读写 |
| PDF 渲染 | react-native-pdf | 支持本地文件与 URL 流式，深色模式 |
| 安全存储 | react-native-keychain | iOS Keychain / Android Keystore（鸿蒙经 RNOH 桥接或 HUKS 原生模块） |
| 推送 | 三通道封装 | Android FCM / iOS APNs / 鸿蒙 Push Kit（见 §7.4） |
| 国际化 | i18next | 复用 papex zh/en 字典 |
| 主题 | 深色模式原生适配 | 跟随系统 + 手动覆盖 |
| 测试 | Jest + React Native Testing Library | 单元；E2E 用 Detox（iOS/Android），鸿蒙真机手工回归 |
| 构建 | Expo prebuild 或裸 RN | **建议裸 RN（RNOH 需要原生工程）**；Expo 仅作依赖管理参考 |
| 包管理 | pnpm workspaces（单包） | 本期单包即可，不强行 monorepo |

### 2.1 版本矩阵（关键）

```
RN 0.82.30  ←→ RNOH 0.82.30（鸿蒙）
             ←→ react-native-pdf（鸿蒙适配需核对 RNOH 三方库清单）
             ←→ react-native-keychain（鸿蒙需确认；不兼容则用 HUKS 桥接模块）
```

> **决策红线**：任何三方库在引入前必须查 RNOH 三方库适配清单（0.72.90+ / 0.77.10+ / 0.82.x 三档）；不兼容则优先找替代库，其次写鸿蒙侧原生桥（TS 接口不变，平台实现切换）。

---

## 3. 架构与目录结构

```
papex-app/
├── android/                 # RN 原生工程（Gradle，APK/AAB）
├── ios/                     # RN 原生工程（Xcode）
├── harmony/                 # RNOH 鸿蒙工程（DevEco Studio，HAP/APP）
├── src/
│   ├── app/                 # 导航栈与页面注册
│   │   ├── navigators/      # Root / Auth / Main（Tab）/ Paper 栈
│   │   └── routes.ts        # 路由常量 + 参数类型
│   ├── features/            # 按功能域组织（内部含 components/hooks/api）
│   │   ├── auth/            # 登录/注册/登出/多账号/设备管理
│   │   ├── papers/          # 浏览/检索/详情/PDF 阅读
│   │   ├── library/         # 收藏/订阅/阅读历史
│   │   ├── profile/         # 个人主页/背书
│   │   ├── messages/        # 站内信/工单/反馈
│   │   └── settings/        # 偏好/i18n/主题/账号
│   ├── lib/                 # 基础层
│   │   ├── api/             # client.ts / auth-refresh.ts / endpoints.ts / errors.ts
│   │   ├── types/           # 由 papex openapi.json 生成（openapi-typescript）
│   │   ├── storage/         # MMKV 封装 / PDF 文件缓存管理
│   │   ├── security/        # keychain 封装（含鸿蒙 HUKS 适配接口）
│   │   ├── push/            # 推送通道抽象（fcm/apns/pushkit 三实现）
│   │   └── i18n/            # i18next 配置 + zh/en 字典（同步自 papex）
│   ├── components/          # 跨 feature 通用组件（PaperCard、Tag、EmptyState…）
│   └── theme/               # 设计令牌（色板/间距/字号，深浅两套）
├── scripts/
│   ├── gen-types.sh         # 拉取 papex openapi.json → 生成 TS 类型
│   └── sync-i18n.sh         # 同步 papex zh/en 字典
├── e2e/                     # Detox（iOS/Android）
├── .env.example             # API_BASE_URL 等
└── package.json
```

### 3.1 依赖方向（防循环）

```
app(navigators) → features → lib(api/security/storage) → 无
                    └────────→ components / theme
```

- features 之间**禁止互相 import**，跨域数据走 Zustand store 或导航参数。
- 所有网络请求必须经过 `lib/api/client.ts`（统一注入 token、错误归一化、401 自动刷新）。

---

## 4. 功能规划

### 4.1 P0 — MVP（可发布三端）

| # | 模块 | 功能点 | 验收标准 |
|---|---|---|---|
| 1 | 认证 | 登录（密码）、注册、登出 | 账号密码登录成功；token 安全存储；登出后本地数据保留但不可访问 |
| 2 | 认证 | 多账号切换 | 可存 ≥2 个会话，一键切换，切后首页数据刷新 |
| 3 | 认证 | 设备管理 | 「设置→设备」列出已登录设备，可远程撤销（调用新后端接口） |
| 4 | 浏览 | 首页信息流 | 最新论文分页列表（复用 `/api/papers`），下拉刷新、上拉加载 |
| 5 | 浏览 | 分类浏览 | 分类树（257 条双语）→ 该分类论文列表 |
| 6 | 检索 | 关键词 + 语义 | 搜索页：关键词过滤、`?semantic=1` 语义开关、结果列表 |
| 7 | 论文详情 | 元数据展示 | 标题/作者/摘要/DOI/来源/许可/版本切换（`/api/papers/[id]`） |
| 8 | 论文详情 | PDF 在线阅读 | react-native-pdf 渲染 `/api/papers/[id]/pdf/[version]`，记住阅读进度 |
| 9 | 论文详情 | 收藏/取消收藏 | `/api/bookmarks` 同步，收藏列表页 |
| 10 | 追更 | 订阅分类/作者 | `/api/subscriptions`，订阅列表管理 |
| 11 | 消息 | 站内信/工单/反馈 | 列表 + 详情 + 回复（`/api/messages`、`/api/tickets`、`/api/feedback`） |
| 12 | 个人 | 主页 + 背书 | 个人信息、收到的背书（`/api/endorsements`） |
| 13 | 设置 | 语言/主题 | zh/en 切换、深色模式、关于页 |
| 14 | 基建 | API client + 类型 | 由 openapi.json 生成，全接口可调用 |

### 4.2 P1 — 离线与体验增强

| # | 模块 | 功能点 | 验收标准 |
|---|---|---|---|
| 15 | 离线 | PDF 离线下载 | 详情页「下载」按钮 → 原生文件缓存；无网时从本地读取；下载队列 + 进度 |
| 16 | 离线 | 元数据离线缓存 | 已读过的论文详情/列表本地缓存（MMKV），离线可浏览 |
| 17 | 阅读 | 阅读进度跨端同步 | 进度上报 `/api/reading-progress`（新后端接口），换设备续读 |
| 18 | 推送 | 新论文/工单提醒 | 订阅分类的新论文推送、工单回复推送（三通道） |
| 19 | 账号 | 生物识别快捷登录 | 指纹/面容解锁 App（token 已存，仅解锁层） |
| 20 | 账号 | API Key 管理入口 | 查看/创建/吊销（对接 `/api/settings/api-keys`） |
| 21 | 体验 | 骨架屏/错误态/空态统一 | 全页面三态齐全，弱网重试 |

### 4.3 P2 — 社区与个性化

| # | 模块 | 功能点 |
|---|---|---|
| 22 | 社区 | 论文评论查看与发表（`/api/papers/[id]/comments`） |
| 23 | 社区 | 背书：给人背书 / 请求背书入口 |
| 24 | 个性化 | 基于收藏/订阅的「为你推荐」（后端算，App 只展示） |
| 25 | 分享 | 论文卡片分享（系统分享面板，带链接与摘要） |
| 26 | 扫码 | 网页版「扫码登录」（后端出二维码接口后启用） |

### 4.4 不做清单（本期明确排除）

投稿/上传 PDF、管理后台、协审、PDF 批注编辑、完整引文管理、平板大屏特化布局（V2 再评估）。

---

## 5. 页面与导航设计

### 5.1 导航结构

```
RootStack
├── AuthStack（未登录）
│   ├── Login
│   ├── Register
│   └── ForgotPassword（预留）
└── MainStack（已登录）
    ├── MainTabs
    │   ├── HomeTab      → 首页信息流 / 分类浏览（双 Tab 或顶部分段）
    │   ├── SearchTab    → 搜索（关键词+语义）
    │   ├── LibraryTab   → 我的：收藏 / 订阅 / 历史 / 下载（分段）
    │   └── ProfileTab   → 个人：主页 / 背书 / 消息 / 设置入口
    ├── PaperDetail      → 论文详情（元数据 + 版本 + 操作）
    ├── PdfViewer        → 全屏 PDF 阅读器
    ├── MessageList / MessageDetail
    ├── TicketDetail / Feedback
    ├── Devices（设备管理）
    ├── ApiKeys
    └── Settings / About
```

### 5.2 关键页面规格

| 页面 | 布局要点 | 数据来源 |
|---|---|---|
| 首页 | 顶部分段「最新 / 分类」，分类为横向 257 树（折叠） | `/api/papers`、`/api/categories` |
| 搜索 | 搜索框 + 语义开关 + 结果列表；历史记录 | `/api/search` |
| 论文详情 | 元数据卡 → 摘要 → 引用 → PDF 预览卡（进度条）→ 操作栏（收藏/下载/分享） | `/api/papers/[id]` + versions |
| PDF 阅读 | 全屏、翻页、缩放、双指、进度条、深色反色 | `/api/papers/[id]/pdf/[version]` |
| 我的 | 信息流式列表：收藏 / 订阅 / 下载 / 历史 | `/api/bookmarks` 等 |
| 设置 | 分组列表：账号 / 设备 / 推送 / 语言 / 主题 / 关于 | 本地 + `/api/auth/me` |

---

## 6. 数据与 API 对接

### 6.1 对接 papex 现有 API（全部复用，不新写）

认证 `POST /api/auth/login|register|logout`、`GET /api/auth/me`；论文 `GET /api/papers`、`GET /api/papers/[id]`、`GET /api/papers/[id]/versions`、`GET /api/papers/[id]/pdf/[version]`；检索 `GET /api/search`、`GET /api/categories`；收藏 `GET/POST/DELETE /api/bookmarks`、`PATCH /api/bookmarks/[paperId]`；订阅 `GET/POST/DELETE /api/subscriptions`；背书 `GET/POST /api/endorsements`；消息 `GET/POST /api/messages`、`GET/POST /api/tickets`、`POST /api/feedback`；API Key `GET/POST/DELETE /api/settings/api-keys`。

### 6.2 需要 papex 后端新增的接口（依赖项，先行同步）

| 接口 | 用途 | 优先级 |
|---|---|---|
| `POST /api/auth/refresh` + `devices` 表 | token 轮换 / 设备撤销（App 登录的基础） | **P0（阻塞）** |
| `GET/PUT /api/reading-progress/[paperId]` | 阅读进度同步 | P1 |
| 推送订阅端点（device token 注册/注销） | 推送 | P1 |

> 这些接口由 papex 主仓库开发，本仓库通过 `scripts/gen-types.sh` 拉取更新后的 `openapi.json` 自动获得类型，**不手工写类型**。

### 6.3 本地存储设计（MMKV）

```
app.session.v1        → 当前会话 { userId, accessToken, refreshToken, expiresAt }
app.sessions.list     → 多账号会话数组（脱敏）
app.lang / app.theme  → 偏好
app.paper.{id}.meta   → 论文元数据缓存（JSON，带 TTL）
app.paper.{id}.progress → 阅读进度（页/百分比/时间）
app.downloads.index   → 已下载 PDF 清单 { paperId, version, path, size, date }
```

PDF 文件存应用沙盒 `Documents/papex-pdfs/{paperId}/{version}.pdf`，由 `lib/storage` 统一管理（LRU 上限可配，默认 2GB）。

---

## 7. 认证与安全

### 7.1 Token 生命周期（与桌面端一致的设计）

```
登录 ─→ { accessToken(15–60min), refreshToken(30d, 轮换+设备绑定) }
          │ 存在安全存储（Keychain / Keystore / HUKS）
          ▼
每次请求: Authorization: Bearer <accessToken>
401 时:  client 自动调 /api/auth/refresh 换新 → 重放原请求
refresh 失效: 清除会话 → 跳登录页
```

### 7.2 安全存储

| 平台 | 方案 |
|---|---|
| iOS | react-native-keychain → Keychain（kSecAttrAccessibleAfterFirstUnlock） |
| Android | react-native-keychain → Keystore + EncryptedSharedPreferences |
| HarmonyOS | HUKS（鸿蒙统一密钥库）。RNOH 无现成库则写 **harmony 侧原生桥**：JS 接口 `secureGet/secureSet(alias, value)`，TS 层保持与两平台一致 |

### 7.3 安全基线

- 禁用明文日志输出 token；`__DEV__` 环境才允许 debug 日志。
- 请求仅走 HTTPS；证书校验保持默认（不关闭）。
- 生物识别解锁（P1）只做「解锁 UI 层」，不替代 token 刷新。
- 设备撤销后，本地会话在下次请求时被 401 驱逐并清除。

### 7.4 推送通道抽象

```
lib/push/index.ts        → 统一接口: init(userId) / register(token) / onMessage()
├── android → FCM（google-services.json）
├── ios     → APNs（证书 + device token）
└── harmony → Push Kit（AGC 配置，RNOH 桥接模块）
```

> 推送依赖后端新接口登记 device token；服务端侧推送通道（FCM/APNs/PushKit）由 papex 后端统一封装，App 只负责注册与展示。

---

## 8. 平台集成（构建 / 签名 / 上架）

| 平台 | 构建产物 | 签名 | 分发 | 自动更新 |
|---|---|---|---|---|
| Android | AAB（Play）/ APK（国内商店） | 自有 keystore | Play Console + 华为/小米等应用市场 | Play 自动更新；国内商店各自渠道包 |
| iOS | IPA | Apple Developer 证书 | TestFlight → App Store | App Store 自动更新 |
| HarmonyOS | HAP/APP | AGC 签名证书 | AppGallery 上架 | AppGallery 更新 |

### 8.1 前置准备（尽早启动）

- Apple Developer 账号（99 美元/年）+ 证书、描述文件；华为开发者账号（实名）+ AGC 工程。
- Android keystore 生成并备份（`keytool`），Play Console 创建应用。
- 隐私合规：上架需「隐私政策」页（说明数据收集与本地存储策略）。

---

## 9. 开发环境搭建（脚手架命令）

```bash
# 1) 克隆并安装（裸 RN，非 Expo）
git clone git@github.com:Maicarons/papex-app.git && cd papex-app
npm i

# 2) 生成类型与 i18n（依赖 papex 仓库的 openapi.json，可先手动拷贝）
npm run gen:types && npm run sync:i18n

# 3) Android 运行
npm run android        # 需 Android SDK（minSdk 24+），模拟器或真机

# 4) iOS 运行
cd ios && pod install && cd .. && npm run ios   # 需 macOS + Xcode

# 5) 鸿蒙（RNOH 0.82.30）
#  - 安装 DevEco Studio 5.x（API 12+）
#  - harmony/ 工程用 DevEco 打开，配置 AGC 签名后运行真机/模拟器
#  - 参考 RNOH 官方脚手架（rnp）生成 harmony 侧并接入
```

### 9.2 验收门禁（每个 PR）

- `tsc --noEmit` 0 错误；Jest 单测通过；iOS/Android 真机冒烟通过。
- 鸿蒙改动：真机手工回归 + 记录在 PR 描述。

---

## 10. 里程碑计划

| 阶段 | 内容 | 验收 | 预估 |
|---|---|---|---|
| M0 基建 | 仓库/CI/RN 工程三端跑通、API client、认证改造联调（依赖后端 refresh 接口） | 三端能登录并拉取首页 | 2 周 |
| M1 MVP | P0 全部 14 项功能 | iOS + Android 发布 TestFlight/内测；鸿蒙真机可用 | 5–6 周 |
| M2 离线+推送 | P1 全部 7 项 | 离线读 PDF、推送可达、设备管理可用 | 3–4 周 |
| M3 发布 | P2 部分 + 三端上架（App Store / Play / AppGallery） | 三端商店正式版 | 3 周 |
| M4 迭代 | P2 其余 + 平板适配评估 | — | 持续 |

> 总预估约 13–15 周（1 名前端全职 + 后端接口依赖方配合）。

---

## 11. 风险与对策

| 风险 | 影响 | 对策 |
|---|---|---|
| RNOH 三方库不兼容（pdf/keychain 等） | 鸿蒙端功能缺失 | 引入前查 RNOH 适配清单；不兼容写鸿蒙原生桥（TS 接口不变） |
| 后端 refresh/设备接口未按期交付 | M0 阻塞 | 先以 API Key（已有 Bearer 通道）打通 MVP 演示，refresh 作为 P0 同步开发 |
| 鸿蒙真机资源（需华为设备/AGC 账号） | 上架延迟 | 尽早申请 AGC、租借/购置测试机；先用模拟器（API 19+） |
| 推送通道三端差异 | 功能反复 | 抽象统一接口，iOS/Android 先行，鸿蒙 PushKit 后置 |
| 网页端 API 变更 | 客户端编译失败 | 一切类型走 openapi 生成，禁止手写；CI 定时拉取校验 |
| 离线 PDF 版权/存储增长 | 存储爆满 | LRU + 可配上限 + 设置页清理入口 |

---

## 12. 里程碑验收口径（M1 后即可作为「网页版替代品」发布）

1. 三端（Android/iOS/鸿蒙）可登录、浏览、检索、读 PDF、收藏、收消息；
2. 设备远程撤销生效；
3. 深色模式与 zh/en 跟随网页端；
4. App Store / Play / AppGallery 各有一版可下载。
