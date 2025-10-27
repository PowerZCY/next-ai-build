# 订阅初始化设计文档

## 核心设计理念

**问题**：之前 Stripe webhook handler 中，初次订阅支付和续费支付的处理逻辑不一致：
- 初次支付：`session.completed` 中 **CREATE** subscription 记录
- 续费支付：`invoice.paid` 中 **UPDATE** subscription 记录

这导致：
1. 逻辑分散，难以维护
2. 如果事件乱序，容易出现问题
3. 订阅记录的初始化时机不清晰

**解决方案**：将订阅记录的初始化提前到**用户注册时**，使得所有 Stripe 事件都只需要 UPDATE，不需要 CREATE。

---

## 架构演进

### 之前的架构

```
用户注册 (Clerk webhook)
  ├─ CREATE User
  ├─ CREATE Credit (free积分)
  └─ (Subscription 未初始化)
        ↓
        ↓ (未知时间)
        ↓
用户订阅 (Stripe webhook: session.completed)
  └─ CREATE Subscription  ← 这里才创建！
     UPDATE Credit (paid积分)
```

**问题**：
- Subscription 的创建时机取决于用户是否订阅
- 逻辑不一致：CREATE vs UPDATE

### 新的架构

```
用户注册 (Clerk webhook)
  ├─ CREATE User
  ├─ CREATE Credit (free积分)
  └─ CREATE Subscription (占位符，status='incomplete')  ← ✅ 提前初始化
        ↓
        ↓ (用户订阅，任意时间)
        ↓
用户订阅初次支付 (Stripe webhook: session.completed)
  └─ UPDATE Subscription (填充 paySubscriptionId + periods)  ← ✅ 只需 UPDATE
     UPDATE Credit (paid积分)

续费支付 (Stripe webhook: invoice.paid)
  └─ UPDATE Subscription (更新 periods)
     UPDATE Credit (续费积分)
```

**优点**：
- ✅ 所有订阅场景都使用 UPDATE，逻辑一致
- ✅ Subscription 记录始终存在，易于查询和维护
- ✅ 占位符模式支持更好的状态转换

---

## 实现细节

### 1. SubscriptionService.initializeSubscription()

**新增方法**（subscription.service.ts:18-27）

```typescript
async initializeSubscription(userId: string): Promise<Subscription> {
  return await prisma.subscription.create({
    data: {
      userId,
      status: SubscriptionStatus.INCOMPLETE,  // ← 占位符状态
      creditsAllocated: 0,
      // 其他字段在实际订阅时填充
    },
  });
}
```

**设计说明**：
- 只设置 `userId` 和初始 `status`
- 其他字段（paySubscriptionId, priceId, periods）在订阅时填充
- 这个占位符确保在任何时刻都能找到该用户的 subscription 记录

### 2. Clerk Webhook 中的初始化

**修改位置**（clerk/user/route.ts:295）

```typescript
async function createNewRegisteredUser(
  clerkUserId: string,
  email?: string,
  fingerprintId?: string
) {
  // 创建新用户
  const newUser = await userService.createUser({ ... });

  // 初始化积分记录
  await creditService.initializeCredit(
    newUser.userId,
    FREE_CREDITS_AMOUNT,
    0
  );

  // ✅ NEW: 初始化订阅占位符
  await subscriptionService.initializeSubscription(newUser.userId);

  // 记录积分充值
  await creditUsageService.recordCreditOperation({ ... });

  console.log(`Created user with subscription placeholder`);
}
```

**时序**：
```
T0: User.CREATE
T1: Credit.CREATE (free)
T2: Subscription.CREATE (placeholder)  ← 3个初始化操作并行执行
T3: CreditUsage.CREATE (审计)
```

### 3. Stripe Webhook 中的订阅更新

#### 初次支付：session.completed

**修改位置**（stripe/webhook-handler.ts:233-263）

```typescript
async function handleSubscriptionCheckoutInit(...) {
  // ... 获取 Stripe subscription 数据 ...

  return await prisma.$transaction(async (tx) => {
    // ✅ CHANGED: 不再 CREATE，而是 FIND + UPDATE
    const existingSubscription = await tx.subscription.findFirst({
      where: {
        userId: transaction.userId,
        status: 'incomplete',  // ← 找占位符
      },
    });

    if (!existingSubscription) {
      throw new Error(
        `Subscription placeholder not found for user ${transaction.userId}.`
      );
    }

    // 更新占位符为真实订阅
    const subscription = await tx.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        paySubscriptionId: subscriptionId,
        priceId: transaction.priceId,
        priceName: transaction.priceName,
        status: stripeSubscription.status,
        creditsAllocated: transaction.creditsGranted,
        subPeriodStart,
        subPeriodEnd,
        updatedAt: new Date(),
      },
    });

    console.log(`Updated subscription placeholder: ${subscription.id}`);

    // ... 更新 Transaction 和 Credit ...
  });
}
```

**关键变化**：
- 从 `CREATE` 改为 `UPDATE`（行 249）
- 使用 `status='incomplete'` 查询占位符
- 一次性填充所有订阅信息

#### 续费支付：invoice.paid

**无需修改**（逻辑已一致）

```typescript
else if (isRenewal) {
  // 找到已激活的 subscription
  const subscription = await tx.subscription.findFirst({
    where: { paySubscriptionId: subscriptionId },
  });

  // 更新周期和充值
  await tx.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'active',
      subPeriodStart,  // 新周期
      subPeriodEnd,    // 新周期
      updatedAt: new Date(),
    },
  });

  // ... 创建 renewal transaction 和充值积分 ...
}
```

---

## 场景覆盖

### 场景 1：新用户注册 → 立即订阅 → 续费

```
T0: user.created webhook (Clerk)
    ├─ CREATE User
    ├─ CREATE Credit (free=50)
    ├─ CREATE Subscription (status='incomplete')
    └─ CreditUsage.CREATE

T1: checkout.session.completed (Stripe)
    ├─ UPDATE Subscription (status='active', periods set)
    ├─ UPDATE Transaction (SUCCESS)
    ├─ UPDATE Credit (paid += 100)
    └─ CreditUsage.CREATE

T2: invoice.paid (billing_reason='subscription_create')
    ├─ UPDATE Transaction (add invoice URLs)
    └─ (no subscription changes)

T3: invoice.paid (billing_reason='subscription_cycle') [1 month later]
    ├─ UPDATE Subscription (new periods)
    ├─ CREATE renewal Transaction
    ├─ UPDATE Credit (paid += 100)
    └─ CreditUsage.CREATE
```

**结果**：
```
User.subscription:
  ├─ status: 'active'
  ├─ paySubscriptionId: 'sub_xxx'
  ├─ priceId: 'price_yyy'
  ├─ creditsAllocated: 100
  ├─ subPeriodStart: 2024-11-01
  └─ subPeriodEnd: 2024-12-01

Credit.balancePaid: 200 (初次100 + 续费100)
```

### 场景 2：新用户注册 → 未订阅

```
T0: user.created webhook (Clerk)
    ├─ CREATE User
    ├─ CREATE Credit (free=50)
    ├─ CREATE Subscription (status='incomplete')  ← 占位符保留
    └─ CreditUsage.CREATE

(后续若干天/月/年：用户未订阅)

Credit.balanceFree: 50 (只有免费积分)
Subscription.status: 'incomplete' (占位符保留)
```

**优点**：
- ✅ 即使用户从不订阅，subscription 记录也存在
- ✅ 便于查询"该用户是否订阅过"
- ✅ 状态转换清晰：incomplete → active → past_due → canceled

### 场景 3：事件乱序（invoice.paid 先到达）

```
预期顺序：
  T0: session.completed  [但延迟或网络问题]
  T1: invoice.paid       [先到达]

处理流程：
  T1: invoice.paid (billing_reason='subscription_create')
      ├─ Find subscription with paySubscriptionId
      ├─ Not found (因为 session.completed 还未处理)
      └─ ⚠️ Warn and skip, 等待 session.completed

  T0: session.completed [最终到达]
      ├─ UPDATE subscription placeholder (paySubscriptionId now set)
      ├─ UPDATE Transaction
      └─ ✅ 正常处理

  [重试机制应该在 invoice.paid 到达时重新处理]
```

**重试方案**（待实现）：
```typescript
// 在 invoice.paid 中，如果找不到 subscription
// 应该标记为待处理，并在后续重试
// 例如：
await redis.lpush(
  'stripe:failed_invoices',
  JSON.stringify({ invoiceId, subscriptionId, timestamp: now })
);

// 定期检查并重试
async function retryFailedInvoices() {
  const failed = await redis.lrange('stripe:failed_invoices', 0, -1);
  for (const item of failed) {
    const { invoiceId, subscriptionId } = JSON.parse(item);
    const invoice = await stripe.invoices.retrieve(invoiceId);
    await handleInvoicePaid(invoice);
  }
}
```

---

## 数据库状态转换图

```
初次支付前：
┌─────────────────────────────────┐
│ Subscription (占位符)           │
├─────────────────────────────────┤
│ id: 1                           │
│ userId: 'user_xxx'              │
│ status: 'incomplete'  ← ★★★★★  │
│ paySubscriptionId: NULL         │
│ priceId: NULL                   │
│ creditsAllocated: 0             │
│ subPeriodStart: NULL            │
│ subPeriodEnd: NULL              │
└─────────────────────────────────┘

初次支付后（session.completed）：
┌─────────────────────────────────┐
│ Subscription                    │
├─────────────────────────────────┤
│ id: 1                           │
│ userId: 'user_xxx'              │
│ status: 'active'  ← ★★★★★     │
│ paySubscriptionId: 'sub_yyy'    │
│ priceId: 'price_zzz'            │
│ creditsAllocated: 100           │
│ subPeriodStart: 2024-11-01      │
│ subPeriodEnd: 2024-12-01        │
└─────────────────────────────────┘

续费后（invoice.paid，billing_cycle）：
┌─────────────────────────────────┐
│ Subscription                    │
├─────────────────────────────────┤
│ id: 1                           │
│ userId: 'user_xxx'              │
│ status: 'active'                │
│ paySubscriptionId: 'sub_yyy'    │
│ priceId: 'price_zzz'            │
│ creditsAllocated: 100           │
│ subPeriodStart: 2024-12-01  ← ★ │
│ subPeriodEnd: 2025-01-01    ← ★ │
└─────────────────────────────────┘
```

---

## 修改清单

### 文件 1：subscription.service.ts

**修改内容**：
```diff
+ async initializeSubscription(userId: string): Promise<Subscription> {
+   return await prisma.subscription.create({
+     data: {
+       userId,
+       status: SubscriptionStatus.INCOMPLETE,
+       creditsAllocated: 0,
+     },
+   });
+ }

  async createSubscription(...) { ... }  // 保留，用于其他场景
```

**新增行数**：19 行

### 文件 2：clerk/user/route.ts

**修改内容**：
```diff
- import { userService, creditService, creditUsageService, Apilogger }
+ import { userService, creditService, creditUsageService, subscriptionService, Apilogger }

  async function createNewRegisteredUser(...) {
    const newUser = await userService.createUser({ ... });
    await creditService.initializeCredit(...);
+   await subscriptionService.initializeSubscription(newUser.userId);
    await creditUsageService.recordCreditOperation({ ... });
  }
```

**新增行数**：1 行（import） + 1 行（function call）

### 文件 3：stripe/webhook-handler.ts

**修改内容**：
```diff
  async function handleSubscriptionCheckoutInit(...) {
    // ... API 调用和数据准备 ...

    return await prisma.$transaction(async (tx) => {
-     const subscription = await tx.subscription.create({
+     const existingSubscription = await tx.subscription.findFirst({
+       where: {
+         userId: transaction.userId,
+         status: 'incomplete',
+       },
+     });
+     if (!existingSubscription) {
+       throw new Error(`Subscription placeholder not found...`);
+     }
+
+     const subscription = await tx.subscription.update({
+       where: { id: existingSubscription.id },
        data: { ... }
      });
    });
  }
```

**修改行数**：~30 行

---

## 向后兼容性

### 现有数据迁移

对于已有的用户（在此更改之前注册的用户），需要运行迁移脚本：

```sql
-- 为所有没有 subscription 记录的用户创建占位符
INSERT INTO subscription (userId, status, creditsAllocated, createdAt, updatedAt)
SELECT
  u.userId,
  'incomplete',
  0,
  NOW(),
  NOW()
FROM users u
WHERE u.userId NOT IN (
  SELECT DISTINCT userId FROM subscription WHERE deleted = 0
);
```

### 旧的 createSubscription 方法

保留 `createSubscription()` 方法以支持：
- 管理员手动创建订阅
- 其他特殊场景
- 第三方支付方式（未来）

---

## 性能考虑

### 数据库查询

**初始化时**（注册时）：
```
Queries: 1
- INSERT subscription (简单，无关联)
```

**订阅时**（session.completed）：
```
Queries: 3
- SELECT subscription (WHERE userId AND status='incomplete')
- UPDATE subscription
- UPDATE transaction (已有，无额外)
```

**续费时**（invoice.paid）：
```
Queries: 3
- SELECT subscription (WHERE paySubscriptionId)
- UPDATE subscription
- INSERT renewal transaction (已有，无额外)
```

**结论**：性能影响微小，额外的 SELECT 查询都有索引支持。

### 索引建议

确保存在以下索引：
```sql
-- 在 subscription 表
CREATE INDEX idx_subscription_userId_status
  ON subscription(userId, status);

CREATE INDEX idx_subscription_paySubscriptionId
  ON subscription(paySubscriptionId);
```

---

## 总结

这个设计带来的改进：

| 方面 | 之前 | 之后 |
|---|---|---|
| 初始化时机 | 不确定（用户订阅时） | 确定（用户注册时） |
| CREATE 时机 | session.completed | Clerk webhook |
| UPDATE 场景 | 续费时 | 续费 + 初次支付 |
| 逻辑一致性 | ❌ 不一致 | ✅ 一致 |
| 事件乱序处理 | ❌ 容易出错 | ⚠️ 有预警 |
| 数据库查询 | 少 | 略多（可接受） |
| 代码复杂性 | 低 | 中等 |
| 可维护性 | ❌ 低 | ✅ 高 |

