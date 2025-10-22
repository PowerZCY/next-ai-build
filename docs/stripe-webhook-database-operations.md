# Stripe Webhook 数据库操作文档

本文档详细说明了每个 Stripe webhook 事件对应的数据库表操作。
使用测试卡号：
- 成功：`4242 4242 4242 4242`
- 拒绝：`4000 0000 0000 0002`
- 3D 验证：`4000 0025 0000 3155`

## 事件概览

| 事件类型 | 涉及表 | 主要操作 |
|---------|--------|----------|
| `checkout.session.completed` | transactions, credits, credit_usages, subscriptions | 更新交易、分配积分、创建订阅 |
| `invoice.paid` | transactions, subscriptions, credits, credit_usages | 创建续费交易、更新订阅、分配积分 |
| `invoice.payment_failed` | subscriptions, transactions | 更新订阅状态、创建失败交易记录 |
| `customer.subscription.created` | subscriptions | 更新订阅详情 |
| `customer.subscription.updated` | subscriptions | 更新订阅状态和周期 |
| `customer.subscription.deleted` | subscriptions | 更新订阅为取消状态 |
| `charge.refunded` | transactions, credits, credit_usages | 更新交易状态、扣除积分 |

---

## 详细操作说明

### 1. `checkout.session.completed` - 结账会话完成

**触发场景**: 用户完成支付流程

**涉及表操作**:

#### 📊 **transactions 表**
- **操作**: `UPDATE` 
- **更新字段**:
  - `orderStatus` → `"success"`
  - `payTransactionId` → session.payment_intent
  - `payCreatedAt` → new Date()
  - `paidDetail` → JSON字符串(包含客户详情、支付状态、总计详情)
  - `payUpdatedAt` → new Date()

#### 💳 **credits 表**
- **操作**: `UPDATE`
- **条件**: 如果 `transaction.creditsGranted > 0`
- **更新字段**:
  - `balancePaid` → 增加积分数量

#### 📈 **credit_usages 表**
- **操作**: `INSERT`
- **条件**: 如果分配了积分
- **插入数据**:
  - `userId`, `feature`, `orderId`, `creditType: PAID`, `operationType: RECHARGE`, `creditsUsed`

#### 📅 **subscriptions 表**
- **操作**: `INSERT` 或 `UPDATE`
- **条件**: 如果 `session.mode === 'subscription'`
- **字段**: `userId`, `paySubscriptionId`, `priceId`, `priceName`, `status`, `creditsAllocated`, `subPeriodStart`, `subPeriodEnd`

---

### 2. `invoice.paid` - 发票支付成功 (订阅续费)

**触发场景**: 订阅自动续费成功

**涉及表操作**:

#### 📊 **transactions 表**
- **操作**: `INSERT`
- **插入数据**:
  - `orderId` → `order_renewal_${timestamp}_${random}`
  - `orderStatus` → `"success"`
  - `paySupplier` → `"STRIPE"`
  - `paySubscriptionId`, `payInvoiceId`, `priceId`, `priceName`
  - `amount` → invoice.amount_paid / 100
  - `type` → `"SUBSCRIPTION"`
  - `creditsGranted`, `subPeriodStart`, `subPeriodEnd`

#### 📅 **subscriptions 表**
- **操作**: `UPDATE`
- **更新字段**:
  - `subPeriodStart` → 新的周期开始时间
  - `subPeriodEnd` → 新的周期结束时间
  - `status` → `"ACTIVE"`
  - `updatedAt` → new Date()

#### 💳 **credits 表**
- **操作**: `UPDATE`
- **条件**: 如果 `subscription.creditsAllocated > 0`
- **更新字段**: `balancePaid` → 增加积分数量

#### 📈 **credit_usages 表**
- **操作**: `INSERT`
- **插入数据**: 续费积分分配记录

---

### 3. `invoice.payment_failed` - 发票支付失败

**触发场景**: 订阅续费失败

**涉及表操作**:

#### 📅 **subscriptions 表**
- **操作**: `UPDATE`
- **更新字段**:
  - `status` → `"PAST_DUE"`
  - `updatedAt` → new Date()

#### 📊 **transactions 表**
- **操作**: `INSERT`
- **插入数据**:
  - `orderId` → `order_failed_${timestamp}_${random}`
  - `orderStatus` → `"FAILED"`
  - `paySupplier` → `"STRIPE"`
  - `amount` → invoice.amount_due / 100
  - `type` → `"SUBSCRIPTION"`
  - `orderDetail` → 失败原因描述

---

### 4. `customer.subscription.created` - 订阅创建

**触发场景**: Stripe 订阅创建 (通常在 checkout.session.completed 后)

**涉及表操作**:

#### 📅 **subscriptions 表**
- **操作**: `UPDATE` (如果记录已存在)
- **更新字段**:
  - `status` → Stripe 订阅状态
  - `subPeriodStart` → 周期开始时间
  - `subPeriodEnd` → 周期结束时间
  - `updatedAt` → new Date()

---

### 5. `customer.subscription.updated` - 订阅更新

**触发场景**: Stripe 订阅状态或属性变更

**涉及表操作**:

#### 📅 **subscriptions 表**
- **操作**: `UPDATE`
- **更新字段**:
  - `status` → 新的订阅状态
  - `subPeriodStart` → 新的周期开始时间
  - `subPeriodEnd` → 新的周期结束时间
  - `updatedAt` → new Date()

---

### 6. `customer.subscription.deleted` - 订阅取消

**触发场景**: 订阅被取消或删除

**涉及表操作**:

#### 📅 **subscriptions 表**
- **操作**: `UPDATE`
- **更新字段**:
  - `status` → `"CANCELED"`
  - `updatedAt` → new Date()

---

### 7. `charge.refunded` - 费用退款

**触发场景**: 订单退款

**涉及表操作**:

#### 📊 **transactions 表**
- **操作**: `UPDATE`
- **更新字段**:
  - `orderStatus` → `"REFUNDED"`
  - `payUpdatedAt` → new Date()

#### 💳 **credits 表**
- **操作**: `UPDATE`
- **条件**: 如果 `transaction.creditsGranted > 0`
- **更新字段**: `balancePaid` → 扣除对应积分数量

#### 📈 **credit_usages 表**
- **操作**: `INSERT`
- **插入数据**:
  - `operationType` → `"CONSUME"`
  - `feature` → `"Credit deduction (refund)"`
  - 其他退款相关信息

---

## 数据流程图

```
用户支付 → checkout.session.completed
    ├── 更新 transactions 表 (SUCCESS)
    ├── 分配积分到 credits 表
    ├── 记录积分操作到 credit_usages 表
    └── 创建/更新 subscriptions 表 (如果是订阅)

订阅续费 → invoice.paid
    ├── 创建新的 transactions 记录 (续费)
    ├── 更新 subscriptions 表 (周期和状态)
    ├── 分配续费积分到 credits 表
    └── 记录积分操作到 credit_usages 表

续费失败 → invoice.payment_failed
    ├── 更新 subscriptions 表 (PAST_DUE)
    └── 创建失败的 transactions 记录

退款处理 → charge.refunded
    ├── 更新 transactions 表 (REFUNDED)
    ├── 扣除 credits 表中的积分
    └── 记录扣除操作到 credit_usages 表
```

## 注意事项

1. **幂等性**: 所有 webhook 处理都应考虑重复调用的情况
2. **事务处理**: 涉及多表操作时建议使用数据库事务
3. **错误处理**: 任何表操作失败都会抛出异常，中断整个 webhook 处理
4. **日志记录**: 所有 webhook 都会通过 `Apilogger.logStripeIncoming` 记录日志
5. **积分分配**: 只有付费积分(`CreditType.PAID`)会被分配和扣除


