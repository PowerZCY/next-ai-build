# CreditOverview 组件使用说明

本组件位于 `packages/third-ui/src/main/credit`，用于在应用中统一展示积分总览信息，包含总余额、积分桶明细、订阅信息与一次性购买入口。组件分为服务端与客户端两层，上层应用只需在服务端准备好数据对象后直接调用。

当前实现遵循最新的视觉与交互规范：

- 导航触发按钮（`CreditNavButton`）仅展示礼包图标与积分数值，浅色主题为白底+紫色渐变 hover，暗色主题为深色胶囊。
- PC 端下拉设置 `modal={false}`，展开后页面仍可滚动；移动端会在下拉展开时锁定 `body`/`html` 滚动，确保视口只聚焦积分内容。
- 订阅区与 CTA 统一使用渐变体系，管理/订阅操作复用 `GradientButton`，`w-full` 下文字居中。
- 积分桶列表为两行布局：首行展示类型和余额，第二行展示过期信息。额外描述通过 hover/focus 提示呈现。

## 组件分层总览

```
components/                                         # apps/ddaas/src/components，业务侧组件目录
├── credit-popover.tsx                         # 业务侧组件
---------------------------------------
credit/                                                       # packages/third-ui/src.main/credit目录，Credit通用封装组件目录
├── credit-nav-button.tsx                    # 下拉组件按钮
├── credit-overview-client.tsx        # 下拉详情客户端组件
├── credit-overview.ts                          # 下拉详情服务端组件
├── types.ts                                              # 类型定义  
```

### 关键角色与职责

| 组件 | 主要职责 |
| ---- | ---- |
| `CreditNavButton` | 统一管理下拉展开/折叠、移动端滚动锁定、全局价格弹窗的生命周期，并通过 Context 让内部组件在需要时折叠下拉或唤起弹窗。 |
| `CreditOverviewClient` | 纯展示逻辑 + 行为编排。内部只需调用 `useCreditNavPopover()` 暴露的 `close`/`openPricingModal` 等方法，而不再直接渲染弹窗。 |
| `CreditOverview` | Server Component，负责获取翻译和拼装 `CreditOverviewClient` 所需的 props。 |

> ⚠️ 价格弹窗的 UI 现在由 `CreditNavButton` 统一渲染，通过 `MoneyPriceInteractive` 复用计费模块视觉；`CreditOverviewClient` 调用 `navPopover.openPricingModal` 时需传入 `pricingContext` 和按模式处理后的 `moneyPriceData`。

## 交互流程

### PC 端

1. 用户点击头部积分按钮 → `DropdownMenu` 展开下拉卡片。由于 `modal={false}`，主页面仍能滚动。
2. 卡片内部按钮：
   - **弹窗类（订阅/一次性）**：调用 `openPricingModal` 打开价格弹窗，再在下一帧折叠下拉，体验无闪烁。
   - **跳转类（管理订阅、fallback URL）**：先折叠下拉，再执行 `window.location.href`。
3. 弹窗与下拉的生命周期解耦：即使下拉已经折叠，弹窗仍挂载在 `CreditNavButton` 下，直到用户点击关闭或 ESC。

### 移动端

1. 点击积分按钮展开下拉时，`credit-nav-button` 会将 `body` 与 `html` 的 `overflow` 改为 `hidden`，禁止背景页面滑动。
2. 外部点击或手势（包括滑动页面空白区域）被监听，一旦触发立即折叠下拉并恢复滚动。
3. 卡片内部按钮行为：
   - **弹窗类**：与 PC 一致，先唤起弹窗，再通过 `requestAnimationFrame` 延迟折叠下拉，避免弹窗闪烁。
   - **跳转类**：折叠后才进行跳转，确保进入新页面/第三方前视图干净。
4. 弹窗本身不锁定页面，仍由 Radix `AlertDialog` 控制，关闭时会恢复滚动；其内容同样可滚动，按钮点击只影响弹窗，不会重新展开下拉。

> 通过 Context 将“折叠 + 弹窗”能力上提到 `CreditNavButton`，任何新增按钮只要调用 `navPopover.close()` 或 `navPopover.openPricingModal(...)` 就能遵循一致的交互规范。

## 数据结构说明

| 字段 | 说明 |
| ---- | ---- |
| `totalBalance: number` | 所有积分类型的总余额，顶部卡片大号展示。 |
| `checkoutUrl: string` | “购买一次性积分”按钮跳转地址（当没有 `pricingContext` 时使用）。 |
| `buckets: CreditBucket[]` | 积分明细数组。 |
| `subscription?: SubscriptionInfo` | 有有效订阅时提供，用于渲染订阅信息卡片。 |
| `pricingContext?: CreditPricingContext` | 提供后优先使用 Money Price 弹窗，所有 CTA 改为 `onClick` 控制，不再依赖 `href`。 |

`CreditBucket` 结构：
- `kind: string`：积分类型标识，例如 `free`、`subscription`、`onetime`。组件会根据内置翻译自动展示标题，可通过 `label` 覆盖。
- `balance: number`：当前余额。
- `limit: number`：该类型积分额度上限。
- `status?: 'active' | 'expiringSoon' | 'expired'`：可选状态标签。
- `progressPercent?: number`：进度条百分比（0-100），不传则由组件根据 `balance/limit` 计算。
- `description?: string`：额外说明，例如剩余天数。为了保持布局紧凑，该信息会在卡片信息按钮上以悬浮提示展示。

`SubscriptionInfo` 结构：
- `planName: string`：订阅名称。
- `periodStart: string`、`periodEnd: string`：ISO 时间字符串，组件会按当前 locale 渲染。
- `manageUrl: string`：管理订阅按钮跳转地址。

## 快速上手

- credit-popover.tsx （业务侧 Server Component）
- 翻译键位credit字段
`CreditPricingContext` 结构：
- `moneyPriceData: MoneyPriceData`：调用 `buildMoneyPriceData` 生成的多语言静态内容；`CreditOverviewClient` 会根据按钮模式（订阅 / 一次性）动态设置 `billingSwitch.defaultKey`。
- `moneyPriceConfig: MoneyPriceConfig`：与 Money Price 主区域共用的支付配置。
- `checkoutApiEndpoint?: string`、`customerPortalApiEndpoint?: string`：Stripe 结算/门户接口。
- `enableSubscriptionUpgrade?: boolean`：沿用 Money Price 行为，用于控制订阅升级按钮是否可点击。
- `initUserContext?: InitUserContext`：透传给 `MoneyPriceInteractive`，避免重复请求用户上下文。

提供 `pricingContext` 时请注意：

1. 入口在积分弹窗中默认聚焦一次性计费，可通过 `moneyPriceData.billingSwitch.defaultKey = 'onetime'` 覆盖默认值，但不要过滤 `billingSwitch.options`，这样用户仍可切换订阅视图。
2. CTA 不再走 `<a href>`，全部通过 `onClick` 调用 `requestPricingModal` 或直接跳转，以便在移动端先折叠菜单再进入下一步。
3. 弹窗使用与 Money Price 主区域完全相同的 `MoneyPriceInteractive`，继续复用 `redirectToCustomerPortal` 等逻辑，支持点击遮罩/ESC 关闭。
