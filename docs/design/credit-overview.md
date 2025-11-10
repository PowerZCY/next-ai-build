# CreditOverview 组件使用说明

本组件位于 `packages/third-ui/src/main/credit`，用于在应用中统一展示积分总览信息，包含总余额、积分桶明细、订阅信息与一次性购买入口。组件分为服务端与客户端两层，上层应用只需在服务端准备好数据对象后直接调用。

当前实现遵循最新的视觉与交互规范：

- 导航触发按钮（`CreditNavButton`）仅展示礼包图标与积分数值，浅色主题为白底+紫色渐变 hover，暗色主题为深色胶囊；弹层设置为 `modal={false}` 并限制内部 `max-height`，因此展开时主页面仍可滚动。
- 总额卡片采用右上 → 左下的紫调渐变，并结合外突的信息按钮营造“缺口”效果；按钮在亮/暗模式下分别使用白底与深紫底，保持与背景的对比度。
- 订阅区与所有 CTA 统一使用渐变体系，管理/订阅操作复用 `GradientButton`，`w-full` 下文字仍居中。
- 积分桶列表为两行布局：首行展示类型、状态 Tag 与 `余额/上限` 比例，第二行展示渐变进度条和百分比。额外描述通过 hover/focus 提示呈现，文本过长时自动省略并提供 tooltip。

## 组件分层总览

```
components/                                         # apps/ddaas/src/components，业务侧组件目录
├── credit-popover.tsx                         # 业务侧组件
---------------------------------------
credit/                                                       # packages/third-ui/src.main/credit目录，Credit通用封装组件目录
├── credit-nav-button.tsx                    # 下拉组件按钮
├── credit-overview-interactive.tsx  # 下拉详情客户端组件
├── credit-overview.ts                          # 下拉详情服务端组件
├── types.ts                                              # 类型定义  
```

## 数据结构说明

| 字段 | 说明 |
| ---- | ---- |
| `totalBalance: number` | 所有积分类型的总余额，顶部卡片大号展示（文字说明通过信息浮层展示）。 |
| `checkoutUrl: string` | “购买一次性积分”按钮跳转地址。 |
| `buckets: CreditBucket[]` | 积分明细数组，至少建议包含 `free`、`subscription`、`onetime` 三种类型。 |
| `subscription?: SubscriptionInfo` | 仅在有有效订阅时提供，用于渲染订阅信息卡片。 |
| `pricingContext?: CreditPricingContext` | （可选）若提供则复用 Money Price 组件弹窗，按钮将不再使用纯跳转链接。 |

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
- `moneyPriceData: MoneyPriceData`：调用 `buildMoneyPriceData` 生成的多语言静态内容。
- `moneyPriceConfig: MoneyPriceConfig`：与 Money Price 主区域共用的支付配置。
- `checkoutApiEndpoint?: string`、`customerPortalApiEndpoint?: string`：Stripe 结算/门户接口。
- `signInPath?: string`：若门户接口返回 401/403 时的 fallback 登录路径。
- `enableSubscriptionUpgrade?: boolean`：沿用 Money Price 行为，用于控制订阅升级按钮是否可点击。
- 用户context，用户进行服务端渲染money price组件。
- 若入口在积分弹窗中默认聚焦一次性计费，可在接入层通过 `moneyPriceData.billingSwitch.defaultKey = 'onetime'` 覆盖默认值，但不要过滤 `billingSwitch.options`，这样用户仍可切换订阅视图；弹窗会共用同一套 `redirectToCustomerPortal` 逻辑，并支持点击遮罩或按下 ESC 时关闭。
