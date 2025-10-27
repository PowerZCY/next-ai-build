# 订阅流程快速参考

## 核心改变

### 之前
```
User Registration (Clerk)
  ├─ User ✅
  ├─ Credit ✅
  └─ Subscription ❌ (未初始化)

User Subscribe (Stripe)
  └─ Subscription CREATE ❌ (CREATE不一致)
```

### 之后
```
User Registration (Clerk)
  ├─ User ✅
  ├─ Credit ✅
  └─ Subscription (占位符) ✅ (提前初始化)

User Subscribe (Stripe)
  └─ Subscription UPDATE ✅ (逻辑一致)
```

---

## 修改文件一览

### 1️⃣ subscription.service.ts
**新增方法**
```typescript
async initializeSubscription(userId: string): Promise<Subscription> {
  // 为新用户创建占位符 subscription
  // status = 'incomplete'
  // creditsAllocated = 0
  // 其他字段待后续填充
}
```

### 2️⃣ clerk/user/route.ts (webhook)
**修改 createNewRegisteredUser 函数**
```typescript
// 添加一行
await subscriptionService.initializeSubscription(newUser.userId);
```

位置：初始化 Credit 之后

### 3️⃣ stripe/webhook-handler.ts
**修改 handleSubscriptionCheckoutInit 函数**
```typescript
// 从 CREATE 改为 UPDATE
const existingSubscription = await tx.subscription.findFirst({
  where: { userId: transaction.userId, status: 'incomplete' }
});

const subscription = await tx.subscription.update({
  where: { id: existingSubscription.id },
  data: { /* 填充所有信息 */ }
});
```

---

## 订阅状态生命周期

```
[User Registration]
       ↓
[subscription: incomplete] ← 占位符状态
       ↓
[User Subscribes via Stripe]
       ↓
[session.completed] → UPDATE subscription to 'active'
       ↓
[subscription: active, periods set]
       ↓
[Monthly Renewal via invoice.paid]
       ↓
[subscription: active, periods updated]
       ↓
[User Cancels]
       ↓
[subscription: canceled]
       ↓
[Failed to Pay]
       ↓
[subscription: past_due]
```

---

## 表操作对照表

### 用户注册（Clerk webhook）

| 表 | 操作 | 说明 |
|---|---|---|
| user | CREATE | 新建用户 |
| credit | CREATE | 初始化积分 (free=50) |
| subscription | CREATE | **新增**：创建占位符 |
| credit_usage | CREATE | 记录积分充值 |

### 初次订阅支付（session.completed）

| 表 | 操作 | 说明 |
|---|---|---|
| subscription | **UPDATE** | **改动**：从 CREATE 改为 UPDATE |
| transaction | UPDATE | 设置 SUCCESS 状态 |
| credit | UPDATE | 充值 paid 积分 |
| credit_usage | CREATE | 记录充值 |

### 续费支付（invoice.paid）

| 表 | 操作 | 说明 |
|---|---|---|
| subscription | UPDATE | 更新周期信息 |
| transaction | CREATE | 新建续费交易记录 |
| credit | UPDATE | 续费充值积分 |
| credit_usage | CREATE | 记录续费 |

### 支付失败（async_payment_failed / payment_failed）

| 表 | 操作 | 说明 |
|---|---|---|
| subscription | UPDATE | 更新状态为 past_due |
| transaction | CREATE/UPDATE | 记录失败 |
| credit | - | 不充值 |

---

## 代码执行流

### 流程图

```
┌──────────────────────────────────────────────────────────┐
│         Clerk Webhook: user.created                     │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ├─ userService.createUser()
                           ├─ creditService.initializeCredit()
                           ├─ subscriptionService.initializeSubscription() ← NEW
                           └─ creditUsageService.recordCreditOperation()

                           ↓ (days/weeks/months later)

┌──────────────────────────────────────────────────────────┐
│      Stripe Webhook: checkout.session.completed         │
└──────────────────────────┬───────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
    GET Stripe Data                    START Transaction
    (subscription.items[0])                 │
         │                                   │
         ├─ Retrieve subscription ✅         ├─ Find subscription
         ├─ Extract periods ✅              │  (WHERE status='incomplete')
         ├─ Validate dates ✅               │
         └─ Log data ✅                     ├─ UPDATE subscription ← KEY CHANGE
                                            ├─ UPDATE transaction
                                            ├─ UPSERT credit
                                            └─ CREATE credit_usage

                                   ↓ (minutes later)

┌──────────────────────────────────────────────────────────┐
│           Stripe Webhook: invoice.paid (init)            │
└──────────────────────────┬───────────────────────────────┘
                           │
                    Check billing_reason
                           │
            ┌──────────────┴──────────────┐
            │                             │
    = 'subscription_create'       = 'subscription_cycle'
    (initial payment confirm)      (renewal)
            │                             │
            ├─ Find subscription          ├─ Find subscription
            │  (now filled)               │  (already exists)
            │                             │
            └─ UPDATE transaction         ├─ UPDATE subscription
              (add invoice URLs)          ├─ CREATE renewal transaction
                                          ├─ UPDATE credit
                                          └─ CREATE credit_usage

                           ↓ (1 month later)

┌──────────────────────────────────────────────────────────┐
│           Stripe Webhook: invoice.paid (renewal)         │
│                        (repeat)                          │
└──────────────────────────────────────────────────────────┘
```

---

## 关键SQL查询

### 初始化占位符
```sql
INSERT INTO subscription (userId, status, creditsAllocated, createdAt, updatedAt)
VALUES (?, 'incomplete', 0, NOW(), NOW());
```

### 找占位符（session.completed 中）
```sql
SELECT * FROM subscription
WHERE userId = ? AND status = 'incomplete'
LIMIT 1;
```

### 更新占位符为真实订阅
```sql
UPDATE subscription
SET
  paySubscriptionId = ?,
  priceId = ?,
  priceName = ?,
  status = ?,
  creditsAllocated = ?,
  subPeriodStart = ?,
  subPeriodEnd = ?,
  updatedAt = NOW()
WHERE id = ?;
```

### 查找激活的订阅（续费时）
```sql
SELECT * FROM subscription
WHERE paySubscriptionId = ? AND deleted = 0;
```

### 更新续费周期
```sql
UPDATE subscription
SET
  status = 'active',
  subPeriodStart = ?,
  subPeriodEnd = ?,
  updatedAt = NOW()
WHERE id = ?;
```

---

## 与旧代码的兼容性

### 保留的方法
- `createSubscription()` - 保留，用于特殊场景
- 所有其他 subscription 查询方法不变

### 新增的方法
- `initializeSubscription(userId)` - 仅在用户注册时调用

### 修改的逻辑
- `handleSubscriptionCheckoutInit()` - UPDATE instead of CREATE
- `handleInvoicePaid()` - 初次支付处理增强了乱序检查

### 数据迁移
对于现有用户，运行迁移脚本为没有 subscription 记录的用户创建占位符

---

## 常见问题

### Q: 为什么要初始化占位符？
A:
1. 保证每个用户都有 subscription 记录
2. 使所有支付逻辑都使用 UPDATE，增强一致性
3. 便于查询用户的订阅状态

### Q: 如果用户永远不订阅呢？
A: Subscription 记录仍然保留（status='incomplete'），可用于：
- 用户界面：查询订阅状态
- 分析：统计未转化用户
- 迁移：用户后来决定订阅时

### Q: 占位符会不会浪费数据库空间？
A: 微乎其微
- 每个占位符只有 ~100 bytes
- 假设 100 万用户，总共 ~100 MB
- 相比 credit、transaction、usage 记录可忽略不计

### Q: 如果 session.completed 没找到占位符呢？
A: 抛出错误，表示用户注册流程异常
```typescript
if (!existingSubscription) {
  throw new Error(
    `Subscription placeholder not found for user ${transaction.userId}. ` +
    `User may not have completed registration properly.`
  );
}
```

### Q: invoice.paid 如果先到达怎么办？
A: 当前设计会输出警告，但不处理
```typescript
if (!subscription) {
  console.warn(`Subscription not found... Event may have arrived out of order...`);
  return;
}
```
改进方案：实现重试机制（见主设计文档）

---

## 验证清单

部署前验证：

- [ ] subscription.service.ts 中 initializeSubscription() 方法可用
- [ ] Clerk webhook 中调用了 initializeSubscription()
- [ ] Stripe webhook 中 session.completed 改为 UPDATE
- [ ] 没有 TypeScript 编译错误
- [ ] 数据库迁移脚本已准备
- [ ] 现有用户数据已迁移
- [ ] 测试：新用户注册 → 验证占位符创建 ✅
- [ ] 测试：新用户订阅 → 验证占位符更新 ✅
- [ ] 测试：续费 → 验证周期更新 ✅
- [ ] 测试：订阅失败 → 验证状态转换 ✅

