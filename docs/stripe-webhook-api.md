## Stripe webhook事件的含义和真实场景流程：

  事件含义

  1. checkout.session.completed - 结账会话完成（一次性支付或订阅首次支付成功）
  2. invoice.paid - 发票支付成功（主要用于订阅续费）
  3. invoice.payment_failed - 发票支付失败（订阅续费失败）
  4. customer.subscription.created - 订阅创建
  5. customer.subscription.updated - 订阅更新（状态、价格等变化）
  6. customer.subscription.deleted - 订阅取消/删除
  7. charge.refunded - 费用退款

  真实场景流程组合

  1. 一次性购买流程

  checkout.session.completed
  ↓ (如果用户申请退款)
  charge.refunded

  2. 订阅创建流程

  checkout.session.completed (首次支付)
  → customer.subscription.created

  3. 订阅续费成功流程

  invoice.paid (自动续费成功)
  → customer.subscription.updated (可能更新期间等信息)

  4. 订阅续费失败流程

  invoice.payment_failed (续费失败)
  → customer.subscription.updated (状态变为past_due)
  ↓ (多次重试失败后)
  customer.subscription.deleted (订阅被取消)

  5. 用户主动取消订阅

  customer.subscription.updated (状态变为canceling)
  → customer.subscription.deleted (在当前计费周期结束时)

  6. 订阅升级/降级流程

  customer.subscription.updated (价格变更)
  → invoice.paid (如果需要立即支付差额)

  7. 订阅退款流程

  charge.refunded (退款)
  → customer.subscription.deleted (取消订阅)

  常见组合场景

  最典型的订阅全生命周期：
  1. checkout.session.completed → customer.subscription.created (用户首次订阅)
  2. invoice.paid → customer.subscription.updated (月度续费)
  3. customer.subscription.updated → customer.subscription.deleted (用户取消)

  这种设计确保了从支付到订阅管理的完整流程覆盖。
