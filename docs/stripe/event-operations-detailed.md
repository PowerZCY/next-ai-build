# invoice.paid 详细操作分析

## 当前实现（基于 webhook-handler.ts 的真实代码）

### 场景A：初次订阅支付 (billing_reason = 'subscription_create')

#### 触发时间
- 用户选择订阅产品 → 支付成功
- 时间线：`checkout.session.completed` → `invoice.paid`

#### 当前代码做了什么（第443-464行）

```typescript
if (isInitialPayment) {
  // 查询由 checkout.session.completed 创建的 Transaction 记录
  const transaction = await tx.transaction.findFirst({
    where: { paySubscriptionId: subscriptionId, orderStatus: OrderStatus.SUCCESS },
  });

  if (transaction) {
    // ⚠️ 仅更新 invoice URLs，不做其他操作
    await tx.transaction.update({
      where: { orderId: transaction.orderId },
      data: {
        payInvoiceId: invoice.id,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        payUpdatedAt: new Date(),
      },
    });
  }
}
```

#### 表操作对比

| 表 | 操作 | checkout.session.completed | invoice.paid (初次) |
|---|---|---|---|
| **Subscription** | CREATE | ✅ 创建 | ❌ 无 |
| **Subscription** | UPDATE | ❌ | ❌ |
| **Transaction** | CREATE | ❌ | ❌ |
| **Transaction** | UPDATE | ✅ 创建订阅时设置 status=SUCCESS | ✅ 只补充 payInvoiceId + URLs |
| **Credit** | UPSERT | ✅ balancePaid += 初始积分 | ❌ 无 |
| **CreditUsage** | CREATE | ✅ 记录初始充值 | ❌ 无 |

#### 关键操作流程

```
checkout.session.completed 处理了：
  1. CREATE Subscription (status='active', periods设置)
  2. UPDATE Transaction (CREATED → SUCCESS, 设置 paySubscriptionId)
  3. UPSERT Credit (balancePaid += 初始积分)
  4. CREATE CreditUsage

invoice.paid (初次) 只做了：
  5. UPDATE Transaction (补充 payInvoiceId + 发票URLs)

💡 所以：invoice.paid 对初次支付是"补充数据"角色，不是"核心处理"角色
```

---

### 场景B：订阅续费 (billing_reason = 'subscription_cycle')

#### 触发时间
- Stripe 根据订阅周期自动生成新 Invoice
- 用户支付成功 → 触发 invoice.paid

#### 当前代码做了什么（第466-552行）

```typescript
else if (isRenewal) {
  // 查询现有的 Subscription 记录
  const subscription = await tx.subscription.findFirst({
    where: { paySubscriptionId: subscriptionId },
  });

  if (!subscription) {
    throw new Error(`Subscription not found for renewal: ${subscriptionId}`);
  }

  // 1️⃣ UPDATE Subscription 的周期
  await tx.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'active',
      subPeriodStart,   // ✅ 更新为新周期
      subPeriodEnd,     // ✅ 更新为新周期
      updatedAt: new Date(),
    },
  });

  // 2️⃣ CREATE 新的 renewal Transaction 记录
  const renewalOrderId = `order_renew_${Date.now()}_...`;
  const renewalCredits = subscription.priceId
    ? getCreditsFromPriceId(subscription.priceId)
    : subscription.creditsAllocated;

  await tx.transaction.create({
    data: {
      userId: subscription.userId,
      orderId: renewalOrderId,
      orderStatus: OrderStatus.SUCCESS,
      paySupplier: 'Stripe',
      paySubscriptionId: subscriptionId,
      payInvoiceId: invoice.id,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      payTransactionId: invoice.payment_intent,
      priceId: subscription.priceId,
      priceName: subscription.priceName,
      type: TransactionType.SUBSCRIPTION,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      creditsGranted: renewalCredits,
      paidAt: new Date(invoice.created * 1000),
      payUpdatedAt: new Date(),
    },
  });

  // 3️⃣ UPDATE Credit：续费充值
  await tx.credit.upsert({
    where: { userId: subscription.userId },
    update: {
      balancePaid: { increment: renewalCredits },
      totalPaidLimit: { increment: renewalCredits },
      paidStart: subPeriodStart,     // ✅ 更新为新周期
      paidEnd: subPeriodEnd,         // ✅ 更新为新周期
    },
    create: {
      userId: subscription.userId,
      balancePaid: renewalCredits,
      totalPaidLimit: renewalCredits,
      paidStart: subPeriodStart,
      paidEnd: subPeriodEnd,
    },
  });

  // 4️⃣ CREATE CreditUsage：续费记录
  await tx.creditUsage.create({
    data: {
      userId: subscription.userId,
      feature: 'subscription_renewal',
      orderId: renewalOrderId,
      creditType: 'paid',
      operationType: 'recharge',
      creditsUsed: renewalCredits,
    },
  });
}
```

#### 表操作对比

| 表 | 操作 | 续费 invoice.paid |
|---|---|---|
| **Subscription** | UPDATE | ✅ 更新周期 (subPeriodStart/End) |
| **Transaction** | CREATE | ✅ 新建续费交易记录 |
| **Credit** | UPDATE/UPSERT | ✅ balancePaid += 续费积分，更新周期 |
| **CreditUsage** | CREATE | ✅ 记录续费充值 |

#### 关键操作流程

```
invoice.paid (续费) 做了：
  1. UPDATE Subscription (更新周期信息)
  2. CREATE 新的 renewal Transaction (记录续费交易)
  3. UPDATE Credit (续费充值 + 更新周期)
  4. CREATE CreditUsage (续费审计记录)

💡 所以：invoice.paid 对续费是"完整处理"角色，包含所有数据更新
```

---

## 完整对比：两个事件在两种情况下的职责分工

### 表格1：数据变更矩阵

```
                          checkout.session.completed    invoice.paid(初次)    invoice.paid(续费)

Subscription.CREATE       ✅ 创建记录                  ❌                    ❌
Subscription.UPDATE       ❌                           ❌                    ✅ 更新周期

Transaction.CREATE        ❌ (在 API 层创建)           ❌                    ✅ 续费交易
Transaction.UPDATE        ✅ PENDING→SUCCESS           ✅ 补充invoice数据    ❌

Credit.UPSERT            ✅ 初始充值积分              ❌                    ✅ 续费充值积分
Credit.UPDATE period     ✅ 设置 paidStart/End        ❌                    ✅ 更新为新周期

CreditUsage.CREATE       ✅ 初始充值记录              ❌                    ✅ 续费记录

payInvoiceId             ❌ (初时无)                   ✅ 补充invoice ID     ✅ 关联invoice
hostedInvoiceUrl         ❌                           ✅ 补充发票URL        ✅ 补充发票URL
invoicePdf               ❌                           ✅ 补充PDF链接        ✅ 补充PDF链接
```

---

## 核心问题分析

### 问题1：初次订阅为什么要分两个事件处理？

**答案**：这是 Stripe 的设计，不是应用的选择

```
Stripe 创建订阅时的流程：
  1. Customer 提交支付信息
  2. Stripe 创建：
     - Subscription 对象 (status='active' or 'incomplete')
     - Invoice 对象 (billing_reason='subscription_create')
     - Charge/Payment
  3. Webhook 事件发送：
     - checkout.session.completed (最快)
     - customer.subscription.created
     - invoice.created
     - invoice.paid (确认支付成功)
```

**为什么应用分两层处理？**
- `checkout.session.completed`：有 `session.metadata.order_id` → 能关联到用户订单
- `invoice.paid`：确认 Stripe 侧支付已完成 → 可作为最终确认

**但实际上**：当前设计中，所有核心逻辑都在 `checkout.session.completed` 处理，`invoice.paid` 只补充invoice信息

### 问题2：有没有可能 invoice.paid 先到，checkout.session.completed 后到？

**答案**：理论上可能，但风险很小

```
Stripe 通常按以下顺序发送（但无序性保证）：
  T0: checkout.session.completed
  T1: customer.subscription.created
  T2: invoice.created
  T3: invoice.paid

如果乱序到达：
  [坏情况] T3 invoice.paid 先到 → 找不到 subscription → 错误
  [好情况] T0 checkout.session.completed 先到 → 创建了 subscription → invoice.paid 可以找到
```

**当前代码问题**：
```typescript
// invoice.paid 初次支付处理
const transaction = await tx.transaction.findFirst({
  where: { paySubscriptionId: subscriptionId, orderStatus: OrderStatus.SUCCESS },
});

if (transaction) {  // ← 如果 transaction 不存在会怎样？
  // 只补充数据，不会创建
}

// 💡 结果：如果 invoice.paid 先到，transaction 不存在，无法补充invoice数据
```

### 问题3：续费时，credit 的 increment 是基于什么价格？

**答案**：基于订阅的当前配置（可能升级/降级）

```typescript
const creditsForRenewal = subscription.priceId
  ? getCreditsFromPriceId(subscription.priceId)  // ✅ 获取当前价格的积分
  : subscription.creditsAllocated;               // ⚠️ 如果获取失败，使用上次的积分

const renewalCredits = creditsForRenewal || subscription.creditsAllocated;
```

**例子**：
- 用户初次订阅 Plan A：100积分/月
- 2个月后升级到 Plan B：200积分/月
- invoice.paid 会根据 Plan B 的配置，续费 200 积分而非 100 积分
- 同时 Credit 的 paidStart/End 更新为新周期

---

## 设计建议：改进初次支付的幂等性

### 当前风险

```
如果 invoice.paid 先到：
  1. subscription 还不存在 ❌
  2. transaction 找不到 ❌
  3. 无法处理，事件丢失 ❌
```

### 改进方案

#### 方案 A：在 invoice.paid 处理初次支付（不依赖 session）

```typescript
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  const isInitialPayment = invoice.billing_reason === 'subscription_create';

  if (isInitialPayment) {
    // 方案A：直接处理初次支付
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

    // 检查是否已处理
    const existingSubscription = await tx.subscription.findFirst({
      where: { paySubscriptionId: subscriptionId },
    });

    if (!existingSubscription) {
      // 第一次处理：创建 subscription + 充值
      await createSubscriptionAndCredits(stripeSubscription, invoice);
    } else {
      // 已处理过：仅补充 invoice 数据
      await updateTransactionWithInvoice(existingSubscription, invoice);
    }
  }
}
```

**优点**：
- ✅ 支持事件无序性
- ✅ 幂等：重复调用也安全

**缺点**：
- ❌ 逻辑变复杂
- ❌ 需要调用 Stripe API

#### 方案 B：在 session 中传递更多信息给 invoice 处理（当前方案的改进）

```typescript
// 在 handleSubscriptionCheckoutInit 时，在 Transaction 中存储标记
await tx.transaction.update({
  where: { orderId: transaction.orderId },
  data: {
    // ... 其他字段
    orderDetail: 'initial_subscription_processed',  // ✅ 标记已处理
  },
});

// 在 handleInvoicePaid 初次支付处理
const transaction = await tx.transaction.findFirst({
  where: { paySubscriptionId: subscriptionId },  // ← 不再要求 orderStatus.SUCCESS
});

if (transaction && transaction.orderDetail?.includes('initial_subscription_processed')) {
  // 已处理过，仅补充 invoice 数据
  await tx.transaction.update({ ... });
} else if (!transaction) {
  // 未处理，需要从 subscription 创建
  throw new Error('Subscription checkout not found before invoice.paid');
}
```

**优点**：
- ✅ 逻辑相对清晰
- ✅ 可检测出乱序问题

**缺点**：
- ⚠️ 仍然无法自动恢复乱序

---

## 总结：invoice.paid 两种情况的操作

| 场景 | billing_reason | 主要操作 | 何时发生 |
|---|---|---|---|
| **初次订阅** | `subscription_create` | UPDATE Transaction (补充发票数据) | checkout.completed 之后 |
| **续费** | `subscription_cycle` | UPDATE Sub + CREATE renewal Tx + UPDATE Credit | 订阅周期到期时自动触发 |

**关键特性**：
- 初次：核心逻辑已在 session.completed 完成，invoice.paid 仅补充数据
- 续费：所有逻辑都在 invoice.paid 完成，包括周期更新和积分充值
- **必须处理**：续费逻辑复杂，invoice.paid 是最终确认
- **可优化**：初次支付的两层处理可简化为一层

