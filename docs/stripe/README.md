# Stripe支付系统设计文档 - V2.0

## 📋 文档总览

本设计方案详细描述了如何将现有的"仅支持订阅模式"的Stripe支付系统，升级为"订阅 + 一次性支付混合模式"，以支持更灵活的用户付费场景。

---

## 🎯 核心目标

### 业务目标
- ✅ 支持订阅模式（Subscription）：长期稳定的会员服务
- ✅ 支持一次性支付（OneTime Payment）：灵活购买积分包
- ✅ 统一积分管理：订阅积分 + 积分包积分
- ✅ 366天订阅有效期：统一的会员权益保障

### 技术目标
- ✅ 保持用户体系不变（已验证）
- ✅ 最小化数据库变更（向后兼容）
- ✅ 完善Webhook处理（支持所有关键事件）
- ✅ 实现幂等性保证（防止重复处理）

---

## 📚 文档结构

### [Part 1: 概述与需求分析](./part1.md)
**核心内容**：
- 现有系统概述与核心问题
- 新设计的核心需求（订阅 + 一次性支付）
- 业务逻辑规则（366天订阅有效期）
- 架构升级策略（保留 vs 升级）
- 技术约束与兼容性保证
- 风险评估与应对措施

**关键决策**：
- 订阅有效期固定为366天（从支付成功时刻计算）
- 订阅用户可在有效期内随时购买积分包
- 用户体系代码完全保留，无需修改

---

### [Part 2: 数据库设计详解](./part2.md)
**核心内容**：
- Subscription表升级设计
  - 新增 `membershipStart/End`（会员有效期）
  - 新增 `billingCycle`（计费周期类型）
  - 保留 `subPeriodStart/End`（Stripe计费周期）
- Transaction表优化（无需修改表结构）
  - `type` 字段支持 subscription/one_time 区分
  - 新增组合索引优化查询
- 数据库迁移脚本
  - 安全的字段新增策略
  - 现有数据自动初始化
  - 回滚脚本保障
- 性能优化建议
  - 索引策略
  - 查询优化示例

**关键设计**：
```sql
-- 新增字段（Subscription表）
membershipStart   TIMESTAMPTZ(6)  -- 会员有效期开始
membershipEnd     TIMESTAMPTZ(6)  -- 会员有效期结束（+366天）
billingCycle      VARCHAR(20)     -- monthly/yearly
```

---

### [Part 3: 支付流程与业务逻辑](./part3.md)
**核心内容**：
- 订阅流程详解
  - 首次订阅：创建Subscription + 366天有效期
  - 订阅续费：重新计算366天（从续费时刻）
  - 订阅升级/降级：价格变更 + 积分调整
- 一次性支付流程
  - 无订阅用户购买积分包
  - 有订阅用户购买积分包（互不影响）
- 积分充值与消耗逻辑
  - 充值规则（订阅 vs 积分包）
  - 消耗优先级（免费优先 → 付费补足）
- 订阅取消与退款
  - 取消策略（立即 vs 周期末）
  - 退款流程（积分回收机制）
- 状态机设计
  - 订阅状态流转
  - 订单状态流转

**关键流程图**：
- 首次订阅流程图（Mermaid）
- 自动续费时序图（Mermaid）
- 一次性支付流程图（Mermaid）
- 订阅/订单状态机（Mermaid）

---

### [Part 4: Stripe集成与API设计](./part4.md)
**核心内容**：
- Stripe配置升级
  - 动态模式支持（subscription/payment）
  - 统一 `createCheckoutSession` 函数
  - Webhook事件列表（11个关键事件）
- API接口设计
  - `POST /api/subscriptions/create`（订阅创建）
  - `POST /api/payments/create`（一次性支付）
  - 接口请求/响应定义
- Webhook事件处理详解
  - `checkout.session.completed`（首次支付）
  - `invoice.paid`（订阅续费）
  - `customer.subscription.deleted`（订阅取消）
  - `payment_intent.succeeded`（一次性支付）
  - 完整的事件分发逻辑
- 错误处理与重试机制
  - Webhook重复投递处理（幂等性）
  - 数据库事务失败重试
  - 告警机制
- 日志与监控
  - Apilog服务（outgoing/incoming）
  - 关键监控指标
- 测试策略
  - Stripe测试环境配置
  - 单元测试示例
  - 集成测试流程
- 上线检查清单

**关键代码示例**：
- Stripe配置动态模式支持
- Webhook幂等性处理
- 订阅续费逻辑（366天重新计算）
- 一次性支付处理逻辑

---

## 🔄 核心业务流程对比

### 订阅模式 vs 一次性支付模式

| 特性 | 订阅模式 | 一次性支付模式 |
|-----|---------|--------------|
| **Stripe模式** | `subscription` | `payment` |
| **创建Subscription记录** | ✅ 是 | ❌ 否 |
| **会员有效期** | ✅ 366天 | ❌ 不影响 |
| **积分充值** | ✅ 订阅配套积分 | ✅ 积分包数量 |
| **自动续费** | ✅ 支持 | ❌ 不支持 |
| **Webhook事件** | checkout.session.completed<br>invoice.paid<br>customer.subscription.* | checkout.session.completed<br>payment_intent.succeeded |
| **适用场景** | 长期稳定使用 | 临时补充积分 |
| **用户权益** | 会员身份 + 周期积分 | 仅积分增加 |

---

## 📊 数据流转示例

### 场景1：用户首次订阅 Pro Monthly
```
1. 前端调用: POST /api/subscriptions/create
   - priceId: "price_pro_monthly"
   - planKey: "P2"
   - billingCycle: "monthly"

2. 后端处理:
   - 创建Transaction记录（orderStatus: created, type: subscription）
   - 创建Stripe Checkout Session（mode: subscription）
   - 返回checkoutUrl

3. 用户支付成功 → Stripe Webhook:
   - checkout.session.completed
   - 创建Subscription记录:
     * membershipStart: 2025-01-15 10:30:00
     * membershipEnd: 2026-01-16 23:59:59 (✅ +366天)
     * creditsAllocated: 250
   - 更新Transaction（orderStatus: success）
   - 充值积分: balancePaid += 250
   - 记录CreditUsage（recharge, paid）
```

### 场景2：有订阅用户购买积分包
```
1. 前端调用: POST /api/payments/create
   - priceId: "price_credits_p2"
   - planKey: "P2"

2. 后端处理:
   - 创建Transaction记录（orderStatus: created, type: one_time）
   - 创建Stripe Checkout Session（mode: payment）
   - 返回checkoutUrl

3. 用户支付成功 → Stripe Webhook:
   - checkout.session.completed
   - 更新Transaction（orderStatus: success）
   - 充值积分: balancePaid += 200
   - 记录CreditUsage（recharge, paid）
   - ❌ 不创建Subscription记录
   - ❌ 不影响membershipEnd（订阅有效期不变）
```

---

## 🛠️ 技术实现要点

### 1. Stripe API版本
```typescript
apiVersion: '2025-09-30.clover'
```

### 2. 会员有效期计算
```typescript
function calculateMembershipPeriod() {
  const now = new Date();
  const membershipEnd = new Date(now);
  membershipEnd.setDate(membershipEnd.getDate() + 366);
  membershipEnd.setHours(23, 59, 59, 999);
  return { membershipStart: now, membershipEnd };
}
```

### 3. Webhook幂等性保证
```typescript
async function handleWebhook(event: Stripe.Event) {
  // 检查事件是否已处理
  const exists = await redis.exists(`stripe:event:${event.id}`);
  if (exists) return { duplicate: true };

  // 处理事件
  await processEvent(event);

  // 标记为已处理（TTL: 30天）
  await redis.setex(`stripe:event:${event.id}`, 2592000, 'processed');
}
```

### 4. 数据库事务保证
```typescript
await prisma.$transaction(async (tx) => {
  // 1. 创建/更新Subscription
  // 2. 更新Transaction状态
  // 3. 充值积分
  // 4. 记录CreditUsage
});
```

---

## ✅ 验收标准

### 功能验收
- [ ] 订阅首次支付流程正常
- [ ] 订阅续费自动处理（366天重新计算）
- [ ] 一次性支付流程正常
- [ ] 订阅用户购买积分包正常
- [ ] 订阅取消流程正常
- [ ] 退款流程正常

### 性能验收
- [ ] Webhook处理延迟 < 500ms
- [ ] 订单创建到支付完成 < 3s
- [ ] 数据库查询P99 < 200ms

### 质量验收
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试全部通过
- [ ] Webhook幂等性测试通过
- [ ] 异常场景测试通过

---

## 🚀 实施步骤

### 阶段1：数据库升级（1-2天）
1. 执行Prisma迁移脚本（新增Subscription字段）
2. 验证现有数据完整性
3. 添加新索引

### 阶段2：Stripe配置更新（1天）
1. 更新 `stripe-config.ts`（支持动态模式）
2. 配置Webhook事件
3. 测试环境验证

### 阶段3：API接口实现（2-3天）
1. 实现 `/api/subscriptions/create`
2. 实现 `/api/payments/create`
3. 实现Webhook处理逻辑

### 阶段4：测试与上线（2-3天）
1. 单元测试编写
2. 集成测试执行
3. Stripe测试环境验证
4. 生产环境灰度发布

**总计：6-9个工作日**

---

## 📞 技术支持

### Stripe文档
- API文档：https://stripe.com/docs/api
- Webhook指南：https://stripe.com/docs/webhooks
- 测试卡号：https://stripe.com/docs/testing

### 相关文档
- V1.0设计文档：`docs/V1.md`
- 前端组件文档：`docs/codex-money.md`
- Webhook事件说明：`docs/stripe-webhook-api.md`

---

## 📝 变更日志

### V2.0 (2025-01)
- ✅ 新增一次性支付模式支持
- ✅ 实现366天订阅有效期逻辑
- ✅ 完善Webhook事件处理
- ✅ 优化数据库设计（新增membership字段）
- ✅ 实现幂等性保证机制

### V1.0 (2024-12)
- ✅ 基础订阅模式实现
- ✅ 用户体系设计（匿名→注册）
- ✅ 积分管理系统
- ✅ Clerk用户认证集成

---

## 🎉 总结

本设计方案通过最小化变更、向后兼容的原则，成功将Stripe支付系统从"仅支持订阅"升级为"订阅 + 一次性支付混合模式"。核心创新点包括：

1. **366天订阅有效期**：统一的会员权益保障，简化业务逻辑
2. **混合付费模式**：满足不同用户的付费偏好，提高转化率
3. **完善的容错机制**：幂等性保证、事务处理、错误重试
4. **清晰的架构分层**：Stripe配置 → API接口 → Webhook处理 → 数据库操作

设计文档已完成，可以开始代码实现阶段！
