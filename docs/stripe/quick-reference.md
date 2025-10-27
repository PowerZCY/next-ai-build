# Stripe Webhook 事件处理快速参考

## 一句话总结

| 事件 | 场景 | 做什么 | 改了哪个表 |
|---|---|---|---|
| `checkout.session.completed` | 一次性支付成功 | 更新 Transaction → SUCCESS | Transaction, Credit, CreditUsage |
| `checkout.session.completed` | 订阅初始支付成功 | 创建 Subscription + 更新 Transaction + 充值积分 | Subscription, Transaction, Credit, CreditUsage |
| `invoice.paid` (billing_reason=**create**) | 订阅初始支付确认 | ⚠️ **仅补充 invoice URLs** | Transaction (仅更新 URLs) |
| `invoice.paid` (billing_reason=**cycle**) | 订阅续费 | 更新周期 + 创建续费记录 + 充值积分 | Subscription, Transaction, Credit, CreditUsage |
| `checkout.session.async_payment_failed` | 支付失败（一次性或初始）| 更新 Transaction → FAILED | Transaction |
| `invoice.payment_failed` | 续费失败 | 创建失败记录 + 标记 Subscription → past_due | Transaction, Subscription |

---

## 详细操作清单

### 1. 一次性支付成功：checkout.session.completed

```
表操作：

✅ Transaction
   UPDATE: CREATED → SUCCESS
   SET: payTransactionId, paidAt, paidEmail

✅ Credit
   UPSERT (创建或更新)
   SET: balanceOneTimePaid += 积分
        oneTimePaidStart = now
        oneTimePaidEnd = now + 365天

✅ CreditUsage
   CREATE: 记录 operationType='recharge'
```

---

### 2. 订阅初始支付：checkout.session.completed

```
表操作：

✅ Subscription
   CREATE: 新记录
   SET: paySubscriptionId, status='active'
        subPeriodStart = Stripe API获取
        subPeriodEnd = Stripe API获取

✅ Transaction
   UPDATE: CREATED → SUCCESS
   SET: paySubscriptionId, payTransactionId, paidAt

✅ Credit
   UPSERT (创建或更新)
   SET: balancePaid += 积分
        totalPaidLimit += 积分
        paidStart = subPeriodStart
        paidEnd = subPeriodEnd

✅ CreditUsage
   CREATE: 记录 feature='subscription'
           operationType='recharge'
```

---

### 3. 订阅初次支付发票：invoice.paid (billing_reason='subscription_create')

```
⚠️ 只做最小操作，因为主逻辑已在 checkout.session.completed 处理

表操作：

✅ Transaction
   UPDATE: 补充发票信息
   SET: payInvoiceId, hostedInvoiceUrl, invoicePdf

❌ Subscription（无操作）
❌ Credit（无操作）
❌ CreditUsage（无操作）

💡 设计理由：
   - invoice.paid 通常在 session.completed 之后
   - 如果 session.completed 已处理，invoice.paid 仅补充数据
   - 如果 invoice.paid 先到，则表示存在乱序问题
```

---

### 4. 订阅续费：invoice.paid (billing_reason='subscription_cycle')

```
核心逻辑全在这里！

表操作：

✅ Subscription
   UPDATE: 更新周期
   SET: subPeriodStart = 新周期开始
        subPeriodEnd = 新周期结束
        updatedAt = now

✅ Transaction
   CREATE: 新的续费交易记录
   SET: orderId = 'order_renew_...'
        orderStatus = SUCCESS
        paySubscriptionId = 续费的subscription ID
        payInvoiceId = invoice ID
        creditsGranted = 当前价格对应的积分 (可能升级/降级)
        amount = invoice.amount_paid / 100
        type = SUBSCRIPTION

✅ Credit
   UPSERT (已存在则更新)
   UPDATE: balancePaid += 续费积分
           totalPaidLimit += 续费积分
           paidStart = 新周期开始
           paidEnd = 新周期结束

✅ CreditUsage
   CREATE: 续费审计记录
   SET: feature = 'subscription_renewal'
        creditsUsed = 续费积分
        orderId = 新的renewal orderId
```

---

### 5. 一次性支付失败：checkout.session.async_payment_failed

```
表操作：

✅ Transaction
   UPDATE: CREATED → FAILED
   SET: orderStatus = FAILED

❌ Subscription（无）
❌ Credit（无操作，不充值）
❌ CreditUsage（无）

💡 用户可重试支付
```

---

### 6. 续费失败：invoice.payment_failed

```
表操作：

✅ Transaction
   CREATE: 新的失败记录
   SET: orderStatus = FAILED
        orderId = 'order_renew_failed_...'
        creditsGranted = 0 (失败不充值)

✅ Subscription
   UPDATE: 标记为逾期
   SET: status = 'past_due'

❌ Credit（无操作，失败不充值）
❌ CreditUsage（可选，如果要审计失败）

💡 用户需要手动补缴或联系支持
```

---

## 事件流时序

### 成功场景

```
┌─── 一次性支付 ───┐
│                 │
├─ 用户支付
│  ↓
├─ checkout.session.completed  ← ✅ 处理成功
│  (更新 Transaction + Credit + CreditUsage)
│  ↓
├─ payment_intent.succeeded
│  (可忽略，信息已包含在 session 中)
│  ↓
└─ 完成


┌─── 订阅初次支付 ───┐
│                   │
├─ 用户支付
│  ↓
├─ checkout.session.completed  ← ✅ 处理初始化
│  (创建 Subscription + 更新 Transaction + 充值 Credit)
│  ↓
├─ customer.subscription.created
│  (可忽略，subscription 已创建)
│  ↓
├─ invoice.created
│  (可忽略，无需操作)
│  ↓
├─ invoice.paid  ← ✅ 补充 invoice URLs
│  (补充 Transaction 的发票信息)
│  ↓
└─ 完成


┌─── 订阅续费 ───┐
│              │
├─ 订阅周期到期
│  ↓
├─ Stripe 自动创建 Invoice
│  ↓
├─ invoice.created
│  (可忽略，无需操作)
│  ↓
├─ invoice.paid  ← ✅ 处理续费
│  (更新周期 + 创建续费 Transaction + 充值 Credit)
│  ↓
└─ 完成
```

### 失败场景

```
┌─── 支付失败 ───┐
│             │
├─ 用户支付失败
│  ↓
├─ checkout.session.async_payment_failed  ← ✅ 标记失败
│  (更新 Transaction → FAILED)
│  ↓
└─ 用户可重试


┌─── 续费失败 ───┐
│             │
├─ Stripe 尝试扣款
│  ↓
├─ 扣款失败 (3次重试都失败)
│  ↓
├─ invoice.payment_failed  ← ✅ 标记逾期
│  (创建失败 Transaction + Subscription → past_due)
│  ↓
└─ 用户需要手动补缴
```

---

## 关键字段对应

### Subscription 周期信息来源

| 场景 | 来源 | 字段 |
|---|---|---|
| 初次支付 | Stripe API `subscription.items[0]` | `current_period_start/end` |
| 续费支付 | Invoice `invoice.lines[0].period` | `start/end` |

### Credit 的积分来源

| 场景 | 来源 | 说明 |
|---|---|---|
| 初次支付 | `transaction.creditsGranted` | 创建订单时已决定 |
| 续费 | `getCreditsFromPriceId(subscription.priceId)` | ⚠️ 可能升级/降级 |

### Transaction 的金额来源

| 场景 | 来源 | 字段 |
|---|---|---|
| 初次支付 | `session` | 不在 Transaction 中显式保存？ |
| 续费 | `invoice.amount_paid / 100` | 精确的续费金额 |

---

## 常见问题

### Q1: invoice.paid 为什么还要处理初次支付的数据？

**A**: 两个原因：
1. **冗余确认**：确保 Stripe 侧支付已完成
2. **信息补充**：invoice.paid 才有完整的发票信息 (URLs)

但实际上：
- 如果 checkout.session.completed 成功，subscription 和 credit 都已创建
- invoice.paid 的初次处理仅补充发票信息

### Q2: 续费时，credit 的 paidStart/End 会覆盖旧值吗？

**A**: 是的，会覆盖

```typescript
await tx.credit.update({
  data: {
    balancePaid: { increment: renewalCredits },  // ← 累加
    totalPaidLimit: { increment: renewalCredits }, // ← 累加
    paidStart: subPeriodStart,     // ← 覆盖为新值
    paidEnd: subPeriodEnd,         // ← 覆盖为新值
  },
});

// 结果：
// balancePaid: 100 + 100 = 200 (有两个月的积分)
// paidStart: 新月开始日期 (覆盖)
// paidEnd: 新月结束日期 (覆盖)
```

### Q3: 如果用户升级了订阅计划呢？

**A**: invoice.paid 会根据新计划充值

```typescript
// 场景：
// 初次：Plan A (100积分) → balancePaid = 100, paidEnd = 2024-12-31
// 升级：Plan B (200积分) → Subscription 更新了 priceId
// 续费：invoice.paid 根据新的 priceId 获取 200 积分

const creditsForRenewal = getCreditsFromPriceId(subscription.priceId);
// → 200 (基于新计划)

balancePaid = 200 + 200 = 400 (累计)
paidStart = 新周期
paidEnd = 新周期
```

### Q4: 如果 invoice.paid 晚到了怎么办？

**A**: 当前设计的风险

```
初次支付乱序：
  如果 invoice.paid 先到 → 找不到 subscription → 无法补充 URLs
  如果 checkout.session.completed 先到 → subscription 存在 → 正常处理

续费乱序：
  基本不会乱序，因为续费的 invoice 依赖 subscription 已存在
  而 subscription 必定是由初次支付创建的
```

**改进方案**：
- 在 webhook 入口实现事件去重 (Redis + event.id)
- 提供手动重试接口
- 监控未处理的 invoice

