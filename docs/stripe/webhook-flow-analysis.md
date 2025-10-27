# Stripe Webhook 事件流详细分析

## 核心问题

根据 part4.md 的设计，存在以下关键问题需要澄清：

### 问题 1：一次性支付失败场景
**文档说**：`checkout.session.completed` 代表支付成功（一次性支付）
**但问题是**：如果支付失败了，应该走哪个事件？

### 问题 2：订阅支付的 session.completed 做了什么
**文档说**：会创建 Subscription 记录 + 更新 Transaction + 充值积分
**但不清楚**：是新增 (CREATE) 还是更新 (UPDATE)？

### 问题 3：invoice.paid 与 session.completed 的关系
**文档说**：invoice.paid 处理续费
**但问题是**：一个订阅的初始支付，session.completed 和 invoice.paid 都会触发，是否会有重复处理？

### 问题 4：事件顺序与幂等性
**关键问题**：Webhook 事件没有顺序保证！
- `checkout.session.completed` 可能晚到
- `invoice.paid` 可能先到
- 必须支持事件重放（重试）

---

## 详细事件流分析

### 一、一次性支付（One-Time Payment）

#### 成功流程
```
用户点击支付 → checkout.session.created → 输入卡号 → 支付成功
                                                    ↓
                                        checkout.session.completed
                                                    ↓
                                        payment_intent.succeeded
```

**关键点**：
- `checkout.session.completed` 是最终确认支付成功的事件
- 此时 `session.payment_status = 'paid'`
- 此时 `session.payment_intent` 包含支付意图对象

#### 失败流程 ❌ 问题
```
用户点击支付 → checkout.session.created → 输入卡号 → 支付失败
                                                    ↓
                                   [CASE 1] 同步失败 (即时拒绝)
                                        ↓
                                   payment_intent.payment_failed
                                        (Session 不会进入 completed)
                                        ↓
                                   checkout.session.async_payment_failed
                                        (如果是异步支付)

                                   [CASE 2] 异步失败 (如3D验证失败)
                                        ↓
                                   checkout.session.async_payment_failed
                                        ↓
                                   payment_intent.payment_failed
```

**当前 part4.md 的问题**：
1. 文档中没有处理 `checkout.session.async_payment_failed` 的完整逻辑
2. 没有说明是否需要 `payment_intent.payment_failed` handler
3. 没有考虑"用户支付失败后重试"的场景

#### 推荐设计（一次性支付失败处理）

```typescript
// 方案1：使用 checkout.session.async_payment_failed（推荐）
async function handleAsyncPaymentFailed(session: Stripe.Checkout.Session) {
  // 获取订单ID
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  const transaction = await transactionService.findByOrderId(orderId);
  if (!transaction) return;

  // 更新Transaction状态为FAILED（可重试）
  await transactionService.updateStatus(orderId, OrderStatus.FAILED);

  // 日志记录失败原因
  console.log(`Payment failed for order ${orderId}`, {
    sessionId: session.id,
    paymentStatus: session.payment_status,
    paymentIntentId: session.payment_intent,
  });
}

// 方案2：使用 payment_intent.payment_failed（备选）
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  // payment_intent 可能不包含 order_id
  // 需要通过反向查询找到对应的订单
  const transaction = await transactionService.findByPayTransactionId(paymentIntent.id);
  if (!transaction) return;

  // 更新状态
  await transactionService.updateStatus(transaction.orderId, OrderStatus.FAILED);
}
```

**选择建议**：
- ✅ **优先使用** `checkout.session.async_payment_failed`，因为有 `session.metadata.order_id`
- ⚠️ **备选** `payment_intent.payment_failed`，因为信息更少

---

### 二、订阅支付（Subscription）

#### 初始支付（First Payment）
```
用户点击订阅 → checkout.session.created (mode='subscription')
                    ↓
            输入卡号 → 支付成功
                    ↓
        ┌─────────────────────────────┐
        │  Stripe 自动创建:           │
        │  1. Customer                │
        │  2. Subscription            │
        │  3. Invoice (billing_reason │
        │     = 'subscription_create')│
        │  4. Payment (charge/intent) │
        └─────────────────────────────┘
                    ↓
        ┌─────────────────────────────────┐
        │  事件 #1: checkout.session.completed  │
        │  (session.payment_status = 'paid')   │
        │  (session.subscription = sub_xxx)    │
        └─────────────────────────────────────┘
                    ↓
        ┌─────────────────────────────────┐
        │  事件 #2: customer.subscription.created │
        │  (subscription.status = 'active')      │
        └─────────────────────────────────────┘
                    ↓
        ┌─────────────────────────────────┐
        │  事件 #3: invoice.paid          │
        │  (billing_reason = 'subscription_create')│
        │  (invoice.subscription = sub_xxx)      │
        │  ⚠️ 注意：这是对同一笔支付的确认    │
        └─────────────────────────────────┘
```

#### 问题分析 🔴

**问题1：三个事件都携带相同信息**
- `checkout.session.completed` ← 拥有 subscription ID 和支付信息
- `customer.subscription.created` ← 拥有 subscription 详情
- `invoice.paid` ← 拥有账单详情，但 `billing_reason = 'subscription_create'`

**问题2：事件无序性导致的重复处理**
如果按照 part4.md 的设计，可能出现：

```
[时间线1 - 正常]
T1: invoice.paid 收到 → 开始处理 (等待subscription记录)
T2: checkout.session.completed 收到 → 创建subscription ← invoice.paid 处理完成

[时间线2 - 异常]
T1: checkout.session.completed 收到 → 创建subscription + 充值积分
T2: invoice.paid 收到 → 再次创建transaction + 再次充值积分 ❌ 重复！
```

#### 优化设计（订阅初始支付）

**关键原则**：
1. **只在一个地方处理初始支付** ← 减少重复
2. **充分利用 subscription.created/updated 事件** ← 获取准确的subscription数据
3. **invoice.paid 中检查 billing_reason 进行过滤** ← 避免重复处理

```typescript
// 方案A：以 checkout.session.completed 为主入口（推荐）

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  const transaction = await transactionService.findByOrderId(orderId);

  if (transaction.type === TransactionType.SUBSCRIPTION) {
    // 订阅模式：现在处理完整逻辑
    return await handleSubscriptionCheckoutInit(session, transaction);
  } else {
    // 一次性支付：处理逻辑
    return await handleOneTimeCheckout(session, transaction);
  }
}

async function handleSubscriptionCheckoutInit(
  session: Stripe.Checkout.Session,
  transaction: Transaction
) {
  // 关键：在 session.completed 时获取完整的 subscription 信息
  const subscriptionId = session.subscription as string;

  // 直接调用 Stripe API 获取最新subscription信息（包含 items）
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

  // 从 subscription.items[0] 获取计费周期
  const subscriptionItem = stripeSubscription.items?.data?.[0];
  const periodStart = new Date(subscriptionItem.current_period_start * 1000);
  const periodEnd = new Date(subscriptionItem.current_period_end * 1000);

  return await prisma.$transaction(async (tx) => {
    // CREATE Subscription 记录
    const subscription = await tx.subscription.create({
      data: {
        userId: transaction.userId,
        paySubscriptionId: subscriptionId,
        status: stripeSubscription.status,  // 'active'
        creditsAllocated: transaction.creditsGranted,
        subPeriodStart: periodStart,
        subPeriodEnd: periodEnd,
      },
    });

    // UPDATE Transaction: PENDING → SUCCESS
    await tx.transaction.update({
      where: { orderId: transaction.orderId },
      data: {
        orderStatus: OrderStatus.SUCCESS,
        paySubscriptionId: subscriptionId,
        payTransactionId: session.payment_intent as string,
        paidAt: new Date(),
      },
    });

    // UPSERT Credit: 初始充值
    await tx.credit.upsert({
      where: { userId: transaction.userId },
      update: {
        balancePaid: { increment: transaction.creditsGranted || 0 },
        totalPaidLimit: { increment: transaction.creditsGranted || 0 },
        paidStart: periodStart,
        paidEnd: periodEnd,
      },
      create: {
        userId: transaction.userId,
        balancePaid: transaction.creditsGranted || 0,
        balanceOneTimePaid: 0,
        paidStart: periodStart,
        paidEnd: periodEnd,
      },
    });

    // CREATE CreditUsage 记录
    await tx.creditUsage.create({
      data: {
        userId: transaction.userId,
        feature: 'subscription',
        orderId: transaction.orderId,
        creditsUsed: transaction.creditsGranted || 0,
      },
    });
  });
}

// invoice.paid：仅处理续费，跳过初始支付
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  // 🔴 关键：检查是否为初始支付
  if (invoice.billing_reason === 'subscription_create') {
    // 初始支付已在 checkout.session.completed 处理
    console.log(`Initial payment already handled in checkout, skipping`);
    return;  // ⚠️ 必须 return，不进行处理
  }

  // 只处理续费 (billing_reason = 'subscription_cycle')
  if (invoice.billing_reason !== 'subscription_cycle') {
    console.warn(`Unhandled invoice billing_reason: ${invoice.billing_reason}`);
    return;
  }

  const subscription = await subscriptionService.findByPaySubscriptionId(subscriptionId);
  if (!subscription) return;

  // 从 invoice.lines[0].period 获取续费周期
  const lineItem = invoice.lines?.data?.[0];
  const periodStart = new Date((lineItem as any).period.start * 1000);
  const periodEnd = new Date((lineItem as any).period.end * 1000);

  return await prisma.$transaction(async (tx) => {
    // UPDATE Subscription: 更新为新周期
    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        subPeriodStart: periodStart,
        subPeriodEnd: periodEnd,
        updatedAt: new Date(),
      },
    });

    // CREATE 续费 Transaction 记录
    const renewalOrderId = `order_renew_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    await tx.transaction.create({
      data: {
        userId: subscription.userId,
        orderId: renewalOrderId,
        orderStatus: OrderStatus.SUCCESS,
        paySupplier: 'Stripe',
        paySubscriptionId: subscriptionId,
        payInvoiceId: invoice.id,
        type: TransactionType.SUBSCRIPTION,
        creditsGranted: subscription.creditsAllocated,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        paidAt: new Date(invoice.created * 1000),
      },
    });

    // UPDATE Credit: 续费充值
    await tx.credit.update({
      where: { userId: subscription.userId },
      data: {
        balancePaid: { increment: subscription.creditsAllocated },
        totalPaidLimit: { increment: subscription.creditsAllocated },
        paidStart: periodStart,     // 更新为新周期
        paidEnd: periodEnd,          // 更新为新周期
      },
    });
  });
}
```

---

### 三、订阅失败场景

#### 初始支付失败
```
[同一次性支付失败流程]
checkout.session.async_payment_failed
  ↓
Transaction: PENDING → FAILED
```

#### 续费支付失败
```
续费期到 → Stripe 自动创建 Invoice
            ↓
        用户支付失败
            ↓
    invoice.payment_failed
            ↓
    CREATE 失败的 renewal Transaction
    UPDATE Subscription.status = 'past_due'
```

```typescript
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  const subscription = await subscriptionService.findByPaySubscriptionId(subscriptionId);
  if (!subscription) return;

  return await prisma.$transaction(async (tx) => {
    // CREATE 失败的续费 Transaction 记录（用于审计和重试）
    const failedOrderId = `order_renew_failed_${Date.now()}_...`;
    await tx.transaction.create({
      data: {
        userId: subscription.userId,
        orderId: failedOrderId,
        orderStatus: OrderStatus.FAILED,
        paySubscriptionId: subscriptionId,
        payInvoiceId: invoice.id,
        creditsGranted: 0,  // ⚠️ 失败不充值
        amount: invoice.amount_due / 100,
      },
    });

    // UPDATE Subscription: 标记为逾期
    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'past_due',
        updatedAt: new Date(),
      },
    });

    // 💡 可选：UPDATE Credit 扣除额度（如果允许透支）
    // 或发送通知给用户进行手动续费
  });
}
```

---

## 幂等性和重试机制

### 问题：webhook 可能重复到达

```
Stripe 发送 webhook →
  ↓
应用超时 →
  ↓
Stripe 重试（可能多次）
  ↓
同一事件可能被处理 N 次
```

### 解决方案：事件去重

```typescript
// webhook 入口应该加入幂等性检查
async function handleStripeWebhook(event: Stripe.Event) {
  // 1. 检查事件是否已处理
  const isProcessed = await redis.exists(`stripe:event:${event.id}`);
  if (isProcessed) {
    console.log(`Event ${event.id} already processed, returning`);
    return NextResponse.json({ received: true });
  }

  // 2. 处理事件
  await processEvent(event);

  // 3. 标记为已处理（TTL: 24小时）
  await redis.setex(`stripe:event:${event.id}`, 86400, 'processed');

  return NextResponse.json({ received: true });
}
```

---

## 数据表操作总结

### 一次性支付成功
```
Transaction:
  ├─ CREATED → SUCCESS
  └─ fields: payTransactionId, paidAt, paidEmail

Credit:
  ├─ UPSERT (如果不存在则创建)
  └─ balanceOneTimePaid += credits
     oneTimePaidStart = now
     oneTimePaidEnd = now + 365 days
```

### 订阅初始支付成功
```
Subscription:
  ├─ CREATE
  └─ fields: status='active', subPeriodStart, subPeriodEnd

Transaction:
  ├─ CREATED → SUCCESS
  └─ fields: paySubscriptionId, payTransactionId, paidAt

Credit:
  ├─ UPSERT
  └─ balancePaid += credits
     paidStart = subPeriodStart
     paidEnd = subPeriodEnd
```

### 订阅续费成功 (invoice.paid)
```
Subscription:
  ├─ UPDATE
  └─ subPeriodStart = new period
     subPeriodEnd = new period

Transaction:
  ├─ CREATE (新的续费记录)
  └─ type = SUBSCRIPTION, orderStatus = SUCCESS

Credit:
  ├─ UPDATE
  └─ balancePaid += credits (续费金额)
     paidStart = new period
     paidEnd = new period

CreditUsage:
  ├─ CREATE
  └─ feature = 'subscription_renewal'
```

### 失败场景
```
Transaction:
  ├─ CREATED → FAILED (一次性)
  └─ CREATE 失败记录 (续费)

Subscription:
  ├─ UPDATE status = 'past_due' (续费失败)

Credit:
  └─ 不更新（失败不充值）
```

---

## 建议的改进

### 1. 区分三种事件类型的优先级
```
优先级1（必须处理）：
  ✅ checkout.session.completed (一次性支付、订阅初始)
  ✅ checkout.session.async_payment_failed (一次性支付失败)
  ✅ invoice.paid (订阅续费)
  ✅ invoice.payment_failed (续费失败)

优先级2（可选，信息冗余）：
  ⚠️ customer.subscription.created (可以从 session.completed 的 API 调用获取)
  ⚠️ customer.subscription.updated (用于非支付的更新)
  ⚠️ payment_intent.succeeded (已由 checkout.session.completed 覆盖)

优先级3（清理）：
  ❌ payment_intent.payment_failed (用 checkout.session.async_payment_failed 替代)
```

### 2. 事件处理顺序设计
```
[方案A - 推荐：以 session 为主，invoice 为补充]

checkout.session.completed (一次性 or 订阅初始)
  ├─ 若为一次性：直接处理完整逻辑
  └─ 若为订阅：创建 subscription + 初始充值

invoice.paid (订阅续费)
  ├─ 检查 billing_reason
  ├─ 如果 = 'subscription_create'：忽略（已在 session.completed 处理）
  └─ 如果 = 'subscription_cycle'：处理续费
```

### 3. 错误恢复机制
```
如果 webhook 处理失败，应该：
1. 不标记为已处理（允许重试）
2. 记录详细的错误日志
3. 发送告警通知
4. 提供手动修复接口

例如：
POST /admin/stripe/retry-webhook/{eventId}
  ↓
  查询 apilog 表
  ↓
  重新处理该事件
```

