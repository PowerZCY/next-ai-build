# CreditOverview 组件使用说明

本组件位于 `packages/third-ui/src/main/credit`，用于在应用中统一展示积分总览信息，包含总余额、积分桶明细、订阅信息与一次性购买入口。组件分为服务端与客户端两层，上层应用只需在服务端准备好数据对象后直接调用。

## 快速上手

```tsx
// apps/ddaas/src/components/credit-popover.tsx （业务侧 Server Component）
import { auth } from '@clerk/nextjs/server';
import { getTranslations } from 'next-intl/server';
import { CreditOverview } from '@third-ui/main/server';
import type { CreditOverviewData } from '@third-ui/main/server';
import { creditService, subscriptionService } from '@/services/database';
import { CreditNavButton } from '@third-ui/main';

export async function CreditPopover({ locale }: { locale: string }) {
  const { userId } = await auth();
  if (!userId) return null;

  const [credit, subscription, t] = await Promise.all([
    creditService.getCredit(userId),
    subscriptionService.getActiveSubscription(userId),
    getTranslations({ locale, namespace: 'credits' }),
  ]);

  if (!credit) return null;

  const data: CreditOverviewData = {
    totalBalance: credit.balanceFree + credit.balancePaid + credit.balanceOneTimePaid,
    checkoutUrl: '#',
    buckets: [
      {
        kind: 'free',
        balance: credit.balanceFree,
        limit: credit.totalFreeLimit,
        expiresAt: credit.freeEnd?.toISOString(),
      },
      {
        kind: 'subscription',
        balance: credit.balancePaid,
        limit: credit.totalPaidLimit,
        expiresAt: (subscription?.subPeriodEnd ?? credit.paidEnd)?.toISOString(),
      },
      {
        kind: 'onetime',
        balance: credit.balanceOneTimePaid,
        limit: credit.totalOneTimePaidLimit,
        expiresAt: credit.oneTimePaidEnd?.toISOString(),
      },
    ],
    subscription: subscription
      ? {
          planName: subscription.priceName ?? t('subscription.active'),
          periodStart: (subscription.subPeriodStart ?? credit.paidStart ?? new Date()).toISOString(),
          periodEnd: (subscription.subPeriodEnd ?? credit.paidEnd ?? new Date()).toISOString(),
          manageUrl: '#',
        }
      : undefined,
  };

  return (
    <CreditNavButton
      locale={locale}
      totalBalance={data.totalBalance}
      title={t('summary.title')}
      totalLabel={t('summary.totalLabel')}
    >
      <CreditOverview locale={locale} data={data} />
    </CreditNavButton>
  );
}
```

```tsx
// apps/ddaas/src/app/[locale]/layout.config.tsx
import { CreditPopover } from '@/components/credit-popover';

export async function homeNavLinks(locale: string) {
  // ...
  return [
    // 其他导航项
    {
      type: 'custom',
      secondary: true,
      children: <CreditPopover locale={locale} />,
    },
    // ...
  ];
}
```

> 其中 `CreditNavButton` 为业务侧的客户端组件，负责导航按钮的交互外壳（触发器样式、展开/收起等），通过 `children` 渲染 `CreditOverview` 内容，可根据品牌需求自行美化。

## 数据结构说明

| 字段 | 说明 |
| ---- | ---- |
| `totalBalance: number` | 所有积分类型的总余额，顶部卡片大号展示。 |
| `checkoutUrl: string` | “购买一次性积分”按钮跳转地址。 |
| `buckets: CreditBucket[]` | 积分明细数组，至少建议包含 `free`、`subscription`、`onetime` 三种类型。 |
| `subscription?: SubscriptionInfo` | 仅在有有效订阅时提供，用于渲染订阅信息卡片。 |

`CreditBucket` 结构：
- `kind: string`：积分类型标识，例如 `free`、`subscription`、`onetime`。组件会根据内置翻译自动展示标题，可通过 `label` 覆盖。
- `balance: number`：当前余额。
- `limit: number`：该类型积分额度上限。
- `status?: 'active' | 'expiringSoon' | 'expired'`：可选状态标签。
- `progressPercent?: number`：进度条百分比（0-100），不传则由组件根据 `balance/limit` 计算。
- `description?: string`：额外说明，例如剩余天数。

`SubscriptionInfo` 结构：
- `planName: string`：订阅名称。
- `periodStart: string`、`periodEnd: string`：ISO 时间字符串，组件会按当前 locale 渲染。
- `manageUrl: string`：管理订阅按钮跳转地址。

## 翻译键位

`CreditOverview` 会在服务端调用 `getTranslations({ locale, namespace: 'credits' })`，请在业务应用对应语言文件中提供如下 JSON 结构（缺失时组件会使用英文兜底）：

```json
{
  "credits": {
    "summary": {
      "title": "积分总览",
      "description": "展示当前所有渠道的剩余积分",
      "totalLabel": "积分"
    },
    "buckets": {
      "title": "积分明细",
      "empty": "当前暂未获得任何积分",
      "limitLabel": "额度",
      "usedLabel": "余额",
      "status": {
        "active": "使用中",
        "expiringSoon": "即将过期",
        "expired": "已过期"
      },
      "labels": {
        "free": "免费积分",
        "subscription": "订阅积分",
        "onetime": "一次性积分"
      }
    },
    "subscription": {
      "title": "订阅信息",
      "active": "当前订阅",
      "periodLabel": "账期",
      "manage": "管理订阅",
      "inactive": "暂无订阅"
    },
    "actions": {
      "buyCredits": "购买一次性积分"
    }
  }
}
```

可根据实际需要扩展 `credits.buckets.labels` 下的键名，以适配自定义的 `kind`。

## 附加组件

- `CreditOverviewClient`：客户端层渲染逻辑，通常无需直接使用。

以上即为积分组件的使用方式和数据契约。若后续需要更多扩展（例如附加操作按钮、状态色彩定制），可在保持数据结构不变的前提下，通过自定义样式覆盖或提交改进需求。
