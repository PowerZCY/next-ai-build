# Part 2: 数据库设计详解

## 1. 设计原则

### 1.1 核心理解
经过重新审视现有schema.prisma设计，明确以下要点：

1. **Subscription表已完善**：
   - `sub_period_start/end` 字段已经记录订阅周期
   - 无需新增membershipStart/End字段
   - 订阅有效期 = sub_period_end

2. **积分按来源分类管理**：
   - 不同来源的积分应该有不同的有效期
   - 每类积分都需要记录起止时间
   - 便于向用户展示积分过期信息

### 1.2 变更策略
- **保持不变**：User、Subscription、Transaction、CreditUsage、UserBackup表
- **扩展优化**：Credit表（新增字段）

---

## 2. Credit表设计升级

### 2.1 现有结构分析
```prisma
model Credit {
  id             BigInt    @id @default(autoincrement())
  userId         String    @unique @map("user_id") @db.Uuid
  balanceFree    Int       @default(0) @map("balance_free")
  totalFreeLimit Int       @default(0) @map("total_free_limit")
  balancePaid    Int       @default(0) @map("balance_paid")
  totalPaidLimit Int       @default(0) @map("total_paid_limit")
  createdAt      DateTime? @default(now()) @map("created_at")
  updatedAt      DateTime? @default(now()) @updatedAt @map("updated_at")
  user           User      @relation(fields: [userId], references: [userId])
}
```

**现有问题**：
1. `balancePaid` 混合了订阅积分和一次性购买积分
2. 缺少积分有效期字段
3. 无法向用户展示不同积分的过期时间

### 2.2 新设计方案

#### 2.2.1 积分分类逻辑
```
积分按来源分为三类：
├── 免费积分（balanceFree）
│   └── 来源：新用户注册、活动赠送、系统补偿
├── 订阅积分（balancePaid）
│   └── 来源：订阅支付（月付/年付）
│   └── 有效期：与订阅周期一致（sub_period_end）
└── 一次性购买积分（balanceOneTimePaid）
    └── 来源：积分包购买（OneTime Payment）
    └── 有效期：独立计算（如购买后1年）
```

#### 2.2.2 完整的Credit表设计
```prisma
model Credit {
  id             BigInt    @id @default(autoincrement())
  userId         String    @unique @map("user_id") @db.Uuid

  // ===== 免费积分 =====
  balanceFree    Int       @default(0) @map("balance_free")
  totalFreeLimit Int       @default(0) @map("total_free_limit")
  freeStart      DateTime? @map("free_start") @db.Timestamptz(6)
  freeEnd        DateTime? @map("free_end") @db.Timestamptz(6)

  // ===== 订阅付费积分 =====
  balancePaid    Int       @default(0) @map("balance_paid")
  totalPaidLimit Int       @default(0) @map("total_paid_limit")
  paidStart      DateTime? @map("paid_start") @db.Timestamptz(6)
  paidEnd        DateTime? @map("paid_end") @db.Timestamptz(6)

  // ===== 一次性支付积分（新增） =====
  balanceOneTimePaid    Int       @default(0) @map("balance_onetime_paid")
  totalOneTimePaidLimit Int       @default(0) @map("total_onetime_paid_limit")
  oneTimePaidStart      DateTime? @map("onetime_paid_start") @db.Timestamptz(6)
  oneTimePaidEnd        DateTime? @map("onetime_paid_end") @db.Timestamptz(6)

  createdAt      DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime? @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  user           User      @relation(fields: [userId], references: [userId], onDelete: Cascade)

  @@index([userId], map: "idx_credits_user_id")
  @@index([freeEnd], map: "idx_credits_free_end")
  @@index([paidEnd], map: "idx_credits_paid_end")
  @@index([oneTimePaidEnd], map: "idx_credits_onetime_paid_end")
  @@map("credits")
}
```

### 2.3 字段说明与业务规则

#### 2.3.1 免费积分（Free Credits）
| 字段 | 类型 | 说明 |
|-----|------|------|
| `balanceFree` | Int | 当前免费积分余额 |
| `totalFreeLimit` | Int | 累计获得的免费积分总量 |
| `freeStart` | DateTime | 免费积分有效期开始时间 |
| `freeEnd` | DateTime | 免费积分有效期结束时间 |

**有效期规则**：
```typescript
// 新用户注册时
freeStart = now()
freeEnd = now() + 30天  // 免费积分30天有效期
```

#### 2.3.2 订阅积分（Subscription Credits）
| 字段 | 类型 | 说明 |
|-----|------|------|
| `balancePaid` | Int | 当前订阅积分余额 |
| `totalPaidLimit` | Int | 累计获得的订阅积分总量 |
| `paidStart` | DateTime | 订阅积分有效期开始时间 |
| `paidEnd` | DateTime | 订阅积分有效期结束时间 |

**有效期规则**：
```typescript
// 订阅支付成功时
paidStart = subscription.sub_period_start
paidEnd = subscription.sub_period_end

// 订阅续费时
paidStart = new_subscription.sub_period_start
paidEnd = new_subscription.sub_period_end
```

**关键逻辑**：订阅积分的有效期与Subscription表的sub_period_end完全一致！

#### 2.3.3 一次性购买积分（OneTime Payment Credits）
| 字段 | 类型 | 说明 |
|-----|------|------|
| `balanceOneTimePaid` | Int | 当前一次性购买积分余额 |
| `totalOneTimePaidLimit` | Int | 累计购买的一次性积分总量 |
| `oneTimePaidStart` | DateTime | 一次性积分有效期开始时间 |
| `oneTimePaidEnd` | DateTime | 一次性积分有效期结束时间 |

**有效期规则**：
```typescript
// 一次性购买成功时
oneTimePaidStart = now()
oneTimePaidEnd = now() + 365天  // 一次性购买积分1年有效期
```

---

## 3. Subscription表（保持不变）

### 3.1 现有结构已完善
```prisma
model Subscription {
  id                BigInt    @id @default(autoincrement())
  userId            String    @map("user_id") @db.Uuid
  paySubscriptionId String?   @map("pay_subscription_id") @db.VarChar(255)
  priceId           String?   @map("price_id") @db.VarChar(255)
  priceName         String?   @map("price_name") @db.VarChar(255)
  status            String    @default("incomplete") @db.VarChar(20)
  creditsAllocated  Int       @default(0) @map("credits_allocated")
  subPeriodStart    DateTime? @map("sub_period_start") @db.Timestamptz(6)  // ✅ 已有
  subPeriodEnd      DateTime? @map("sub_period_end") @db.Timestamptz(6)    // ✅ 已有
  createdAt         DateTime? @default(now()) @map("created_at")
  updatedAt         DateTime? @default(now()) @updatedAt @map("updated_at")
  deleted           Int       @default(0)
  user              User      @relation(fields: [userId], references: [userId])
}
```

**无需修改**：
- ✅ `sub_period_start/end` 字段已经完美记录订阅周期
- ✅ `creditsAllocated` 记录每个周期分配的积分数量
- ✅ `status` 字段管理订阅状态

---

## 4. Transaction表（保持不变）

### 4.1 现有设计已支持
```prisma
model Transaction {
  id                BigInt    @id @default(autoincrement())
  userId            String    @map("user_id") @db.Uuid
  orderId           String    @unique @map("order_id") @db.VarChar(255)
  orderStatus       String    @default("created") @map("order_status")
  type              String?   @db.VarChar(20)  // ✅ subscription / one_time
  creditsGranted    Int?      @default(0) @map("credits_granted")
  paySubscriptionId String?   @map("pay_subscription_id")
  // ... 其他字段
}
```

**type字段用法**：
- `subscription`：订阅模式 → 影响Subscription表和Credit.balancePaid
- `one_time`：一次性支付 → 仅影响Credit.balanceOneTimePaid

---

## 5. 数据库迁移脚本

### 5.1 迁移SQL
```sql
-- Step 1: 新增一次性购买积分相关字段
ALTER TABLE credits
ADD COLUMN balance_onetime_paid INT DEFAULT 0,
ADD COLUMN total_onetime_paid_limit INT DEFAULT 0,
ADD COLUMN onetime_paid_start TIMESTAMPTZ(6),
ADD COLUMN onetime_paid_end TIMESTAMPTZ(6);

-- Step 2: 新增免费积分有效期字段
ALTER TABLE credits
ADD COLUMN free_start TIMESTAMPTZ(6),
ADD COLUMN free_end TIMESTAMPTZ(6);

-- Step 3: 新增订阅积分有效期字段
ALTER TABLE credits
ADD COLUMN paid_start TIMESTAMPTZ(6),
ADD COLUMN paid_end TIMESTAMPTZ(6);

-- Step 4: 为现有用户初始化免费积分有效期（30天）
UPDATE credits
SET
  free_start = created_at,
  free_end = created_at + INTERVAL '30 days'
WHERE balance_free > 0
  AND free_start IS NULL;

-- Step 5: 为现有订阅用户初始化订阅积分有效期
UPDATE credits c
SET
  paid_start = s.sub_period_start,
  paid_end = s.sub_period_end
FROM subscriptions s
WHERE c.user_id = s.user_id
  AND s.status = 'active'
  AND s.deleted = 0
  AND c.balance_paid > 0
  AND c.paid_start IS NULL;

-- Step 6: 创建索引
CREATE INDEX idx_credits_free_end ON credits(free_end);
CREATE INDEX idx_credits_paid_end ON credits(paid_end);
CREATE INDEX idx_credits_onetime_paid_end ON credits(onetime_paid_end);

-- Step 7: 验证迁移
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM credits
  WHERE free_start IS NOT NULL OR paid_start IS NOT NULL;

  RAISE NOTICE 'Successfully updated % credit records', updated_count;
END $$;
```

### 5.2 回滚脚本
```sql
ALTER TABLE credits
DROP COLUMN IF EXISTS balance_onetime_paid,
DROP COLUMN IF EXISTS total_onetime_paid_limit,
DROP COLUMN IF EXISTS onetime_paid_start,
DROP COLUMN IF EXISTS onetime_paid_end,
DROP COLUMN IF EXISTS free_start,
DROP COLUMN IF EXISTS free_end,
DROP COLUMN IF EXISTS paid_start,
DROP COLUMN IF EXISTS paid_end;

DROP INDEX IF EXISTS idx_credits_free_end;
DROP INDEX IF EXISTS idx_credits_paid_end;
DROP INDEX IF EXISTS idx_credits_onetime_paid_end;
```

---

## 6. 积分有效期展示逻辑

### 6.1 用户界面展示
```typescript
interface CreditDisplay {
  // 免费积分
  freeCredits: {
    balance: number;
    expiresAt: Date | null;
    daysRemaining: number;
  };

  // 订阅积分
  subscriptionCredits: {
    balance: number;
    expiresAt: Date | null;
    renewsOn: Date | null;  // 订阅续费日期
  };

  // 一次性购买积分
  oneTimeCredits: {
    balance: number;
    expiresAt: Date | null;
    daysRemaining: number;
  };

  // 总计
  totalBalance: number;
}

async function getUserCreditsDisplay(userId: string): Promise<CreditDisplay> {
  const credit = await prisma.credit.findUnique({
    where: { userId },
    include: {
      user: {
        include: {
          subscriptions: {
            where: { status: 'active', deleted: 0 },
            orderBy: { subPeriodEnd: 'desc' },
            take: 1
          }
        }
      }
    }
  });

  if (!credit) throw new Error('Credit record not found');

  const now = new Date();

  return {
    freeCredits: {
      balance: credit.balanceFree,
      expiresAt: credit.freeEnd,
      daysRemaining: credit.freeEnd
        ? Math.ceil((credit.freeEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0
    },
    subscriptionCredits: {
      balance: credit.balancePaid,
      expiresAt: credit.paidEnd,
      renewsOn: credit.user.subscriptions[0]?.subPeriodEnd || null
    },
    oneTimeCredits: {
      balance: credit.balanceOneTimePaid,
      expiresAt: credit.oneTimePaidEnd,
      daysRemaining: credit.oneTimePaidEnd
        ? Math.ceil((credit.oneTimePaidEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0
    },
    totalBalance: credit.balanceFree + credit.balancePaid + credit.balanceOneTimePaid
  };
}
```

### 6.2 前端展示示例
```tsx
// 用户积分面板
<CreditPanel>
  <CreditSection type="subscription">
    <Badge>订阅积分</Badge>
    <Balance>{subscriptionCredits.balance}</Balance>
    {subscriptionCredits.renewsOn && (
      <RenewDate>
        续费日期: {formatDate(subscriptionCredits.renewsOn)}
        <br/>
        到期后自动充值 {subscription.creditsAllocated} 积分
      </RenewDate>
    )}
  </CreditSection>

  <CreditSection type="onetime">
    <Badge>购买积分</Badge>
    <Balance>{oneTimeCredits.balance}</Balance>
    {oneTimeCredits.expiresAt && (
      <ExpiryWarning>
        剩余 {oneTimeCredits.daysRemaining} 天过期
        <br/>
        到期时间: {formatDate(oneTimeCredits.expiresAt)}
      </ExpiryWarning>
    )}
  </CreditSection>

  <CreditSection type="free">
    <Badge>免费积分</Badge>
    <Balance>{freeCredits.balance}</Balance>
    {freeCredits.expiresAt && (
      <ExpiryWarning>
        剩余 {freeCredits.daysRemaining} 天过期
      </ExpiryWarning>
    )}
  </CreditSection>

  <TotalBalance>
    总计: {totalBalance} 积分
  </TotalBalance>
</CreditPanel>
```

---

## 7. 积分过期处理

### 7.1 定时任务清理过期积分
```typescript
// 每日凌晨执行
async function cleanExpiredCredits() {
  const now = new Date();

  // 1. 清理过期免费积分
  const expiredFreeCredits = await prisma.credit.findMany({
    where: {
      balanceFree: { gt: 0 },
      freeEnd: { lt: now }
    }
  });

  for (const credit of expiredFreeCredits) {
    await prisma.$transaction(async (tx) => {
      // 记录积分清零操作
      await tx.creditUsage.create({
        data: {
          userId: credit.userId,
          feature: 'expired_cleanup',
          creditType: 'free',
          operationType: 'consume',
          creditsUsed: credit.balanceFree,
        }
      });

      // 清零免费积分
      await tx.credit.update({
        where: { userId: credit.userId },
        data: { balanceFree: 0 }
      });
    });

    console.log(`Cleared ${credit.balanceFree} expired free credits for user ${credit.userId}`);
  }

  // 2. 清理过期一次性购买积分
  const expiredOneTimeCredits = await prisma.credit.findMany({
    where: {
      balanceOneTimePaid: { gt: 0 },
      oneTimePaidEnd: { lt: now }
    }
  });

  for (const credit of expiredOneTimeCredits) {
    await prisma.$transaction(async (tx) => {
      await tx.creditUsage.create({
        data: {
          userId: credit.userId,
          feature: 'expired_cleanup',
          creditType: 'paid',
          operationType: 'consume',
          creditsUsed: credit.balanceOneTimePaid,
        }
      });

      await tx.credit.update({
        where: { userId: credit.userId },
        data: { balanceOneTimePaid: 0 }
      });
    });

    console.log(`Cleared ${credit.balanceOneTimePaid} expired one-time credits for user ${credit.userId}`);
  }

  // 3. 清理过期订阅积分（订阅已取消且过期）
  const expiredPaidCredits = await prisma.credit.findMany({
    where: {
      balancePaid: { gt: 0 },
      paidEnd: { lt: now }
    },
    include: {
      user: {
        include: {
          subscriptions: {
            where: { status: 'active', deleted: 0 }
          }
        }
      }
    }
  });

  for (const credit of expiredPaidCredits) {
    // 如果用户还有活跃订阅，跳过（不清理）
    if (credit.user.subscriptions.length > 0) {
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.creditUsage.create({
        data: {
          userId: credit.userId,
          feature: 'expired_cleanup',
          creditType: 'paid',
          operationType: 'consume',
          creditsUsed: credit.balancePaid,
        }
      });

      await tx.credit.update({
        where: { userId: credit.userId },
        data: { balancePaid: 0 }
      });
    });

    console.log(`Cleared ${credit.balancePaid} expired subscription credits for user ${credit.userId}`);
  }
}
```

---

## 8. 总结

### 8.1 核心修正点
1. ✅ **Subscription表无需修改**：sub_period_start/end已完善
2. ✅ **Credit表按来源分类**：
   - 免费积分（balanceFree）+ 有效期
   - 订阅积分（balancePaid）+ 有效期（与订阅周期一致）
   - 一次性积分（balanceOneTimePaid）+ 独立有效期
3. ✅ **积分有效期透明展示**：用户可清晰看到每类积分的过期时间

### 8.2 业务价值
- ✅ 用户明确知道积分过期时间，提高使用率
- ✅ 订阅积分自动续期，一次性积分独立管理
- ✅ 支持灵活的积分策略（不同有效期）

### 8.3 下一步
详见 **Part 3: 支付流程与业务逻辑**，将基于新的Credit表设计实现完整的积分管理流程。
