
## 关键设计原则

| 原则 | 实现方式 |
|------|----------|
| **业务锚点** | `subscription.metadata.order_id`（订阅）<br>`session.metadata.order_id`（One-Time） |
| **幂等键** | `event.id` → 数据库唯一索引 |
| **事件无序安全** | 所有事件都通过 `order_id` 查询数据库 <br> 通过订阅ID实时查询 |

## 订单状态扭转

| 路径 | 起始状态 | 触发事件 | 目标状态 | 条件/说明 |
|------|---------|----------|---------|----------|
| **创建 → 同步成功** | `created` | `checkout.session.completed` | `success` | `payment_status = 'paid'` |
| **创建 → 异步待处理** | `created` | `checkout.session.completed` | `pending_unpaid` | `payment_status = 'unpaid'` |
| **异步待处理 → 成功** | `pending_unpaid` | `checkout.session.async_payment_succeeded` | `success` | 银行确认到账 |
| **异步待处理 → 失败** | `pending_unpaid` | `checkout.session.async_payment_failed` | `failed` | 银行拒绝支付 |
| **创建 → One-Time 成功** | `created` | `payment_intent.succeeded` | `success` | 非 Checkout 一次性支付 |
| **创建 → One-Time 失败** | `created` | `payment_intent.payment_failed` | `failed` | 非 Checkout 支付失败 |
| **成功 → 续订成功** | `success` | `invoice.paid` | `success` | 每月自动续订 |
| **成功 → 续订失败** | `success` | `invoice.payment_failed` | `success` | 保持状态，记录 `failed_attempts++` |
| **成功 → 退款** | `success` | `charge.refunded` | `refunded` | 管理员发起退款 |
| **成功 → 取消订阅** | `success` | `customer.subscription.deleted` | `canceled` | 周期末取消 |
| **失败 → 退款** | `failed` | `charge.refunded` | `refunded` | 退款已失败的订单 |
| **失败 → 重试** | `failed` | 用户重新支付 | `created` | 创建新订单或复用原订单 |
| **终态** | `refunded` | — | `refunded` | 不可逆 |
| **终态** | `canceled` | — | `canceled` | 不可逆 |
| **终态** | `failed` | — | `failed` | 可重试 |

### 总览

```mermaid
flowchart TD
    A[created] -->|"checkout.session.completed <br/>「payment_status=unpaid」"| B[pending_unpaid]
    A -->|"checkout.session.completed <br/> 「payment_status=paid」"| C[success]
    A -->|"checkout.session.completed <br/>「no_payment_required」"| C

    B -->|checkout.session.<br/>async_payment_succeeded| C
    B -->|checkout.session.<br/>async_payment_failed| F[failed]
    B -->|payment_intent.<br/>payment_failed| F

    C -->|charge.refunded| D[refunded]
    C -->|customer.subscription.deleted| E[canceled]
    

    F -->|charge.refunded| D
    F -->|用户重新支付| A

    style A fill:#f9f,stroke:#333
    style B fill:#fff3cd,stroke:#856404
    style C fill:#d4edda,stroke:#155724
    style D fill:#d1ecf1,stroke:#0c5460
    style E fill:#f8d7da,stroke:#721c24
    style F fill:#f5c6cb,stroke:#721c24
```

### 同步·异步支付成功或失败

```mermaid
flowchart TD
    A[created] 
    B[pending_unpaid] 
    C[success]
    D[failed]
    
    subgraph "同步支付路径"
        A1[A created] -->|"checkout.session.completed<br/>「payment_status=paid」"| C1[C success]
    end
    
    subgraph "异步支付路径"
        A2[A created] -->|"checkout.session.completed<br/>「payment_status=unpaid」"| B2[B pending_unpaid]
        B2 -->|"checkout.session.async_payment_succeeded"| C2[C success]
        B2 -->|"checkout.session.async_payment_failed"| D2[D failed]
    end
    
    subgraph "One-Time 支付"
        A3[A created] -->|"payment_intent.succeeded"| C3[C success]
        A3 -->|"payment_intent.payment_failed"| D3[D failed]
    end
    
    style A1 fill:#f9f
    style C1 fill:#d4edda
    style A2 fill:#f9f
    style B2 fill:#fff3cd
    style C2 fill:#d4edda
    style D2 fill:#f5c6cb
    style A3 fill:#f9f
    style C3 fill:#d4edda
    style D3 fill:#f5c6cb
```

### 续订成功或失败

```mermaid
flowchart TD
    C[success]
    S1[success with failed_attempts=1]
    S2[success with failed_attempts=2]
    
    subgraph "续订成功"
        C -->|"invoice.paid"| C
    end
    
    subgraph "续订失败 - Dunning 流程"
        C -->|"invoice.payment_failed"| S1
        S1 -->|"第1天: 发送提醒邮件"| S1
        S1 -->|"第3天: 发送第二次提醒"| S2
        S2 -->|"第7天: 最终警告"| S2
        S2 -->|"用户更新支付方式"| C
        S2 -->|"用户仍未支付"| C
    end
    
    style C fill:#d4edda
    style S1 fill:#fff3cd
    style S2 fill:#fff3cd
```

### 已成功订单退款或取消

```mermaid
flowchart TD
    C[success] 
    D[refunded]
    E[canceled]
    
    subgraph "退款流程"
        C -->|"charge.refunded"| D
    end
    
    subgraph "订阅取消流程"
        C -->|"用户点击取消订阅"| C1[success + cancel_at_period_end=true]
        C1 -->|"周期结束"| E
    end
    
    subgraph "终态"
        D -->|终态| D
        E -->|终态| E
    end
    
    style C fill:#d4edda
    style D fill:#d1ecf1
    style E fill:#f8d7da
    style C1 fill:#d4edda
```

### 已失败订单退款或重试

```mermaid
flowchart TD
    F[failed]
    D[refunded]
    A[created]
    C[success]
    
    subgraph "失败订单退款"
        F -->|"charge.refunded"| D
    end
    
    subgraph "用户重试支付"
        F -->|"用户重新发起 Checkout"| A
        A -.->|新订单流程| C
    end
    
    subgraph "终态"
        D -->|终态| D
    end
    
    style F fill:#f5c6cb
    style D fill:#d1ecf1
    style A fill:#f9f
    style C fill:#d4edda
```


## 核心事件

| 事件 | 所属模块 | 关键作用 | 触发时机 | 你必须做的事（业务 + 幂等） |
|------|----------|----------|----------|----------------------------|
| `checkout.session.completed` | Checkout | 首次支付成功（入口） | 用户完成 Checkout（订阅或 One-Time） | 1. 读取 `session.metadata.order_id`<br>2. **写入 `subscription_id`（订阅）或 `status=paid`（One-Time）**<br>3. 发送欢迎/购买成功邮件 |
| `checkout.session.async_payment_succeeded` | Checkout | 异步支付成功 | 异步支付最终成功（如 SEPA） | 同 `checkout.session.completed`，**不要重复激活**（幂等） |
| `checkout.session.async_payment_failed` | Checkout | 异步支付失败 | 异步支付最终失败 | 更新订单为 `failed`，发送失败邮件 |
| `invoice.paid` | Invoice | **续订成功 / 首次成功** | 首次支付成功 / 每次续订成功 | 1. `stripe.subscriptions.retrieve(invoice.subscription)`<br>2. 读取 `subscription.metadata.order_id`<br>3. **更新付费周期、激活权限**<br>4. 发送续订成功邮件 |
| `invoice.payment_failed` | Invoice | 续订失败 | 续订支付失败 | 1. 标记订阅为 `past_due`<br>2. 启动 dunning（第1天、第3天、第7天邮件） |
| `invoice.upcoming` | Invoice | 续订前提醒 | 续订前（默认 3 天） | 发送“即将扣款”邮件，含 `hosted_invoice_url` |
| `customer.subscription.created` | Subscription | 订阅创建（可选） | 订阅对象创建 | **可选**：可由 `checkout.session.completed` 替代 |
| `customer.subscription.updated` | Subscription | **升降级、数量变更** | 升降级、数量变更、取消设置 | 1. 比较 `previous_attributes`<br>2. 若 `items` 变更 → 更新用户计划<br>3. 若 `cancel_at_period_end` → 标记为待取消 |
| `customer.subscription.deleted` | Subscription | 用户取消 | 订阅彻底结束 | 1. 停用用户权限<br>2. 清理资源<br>3. 发送取消确认邮件 |
| `customer.subscription.pending_update_applied` | Subscription | 延迟升降级生效 | 延迟升降级生效 | **更新用户计划为新计划**，发送升级成功邮件 |
| `customer.subscription.pending_update_expired` | Subscription | 升降级因支付失败取消 | 延迟升降级因支付失败取消 | 恢复原计划，发送“升级失败”邮件 |
| `payment_intent.succeeded` | One-Time | One-Time 支付成功 | One-Time 支付成功（非 Checkout） | 同 `checkout.session.completed`（One-Time） |
| `payment_intent.payment_failed` | One-Time | One-Time 支付失败 | One-Time 支付失败 | 更新订单为 `failed`，发送失败邮件 |
| `charge.refunded` | Refund | 退款成功 | 退款成功 | 1. 更新 `order.refunded_at`<br>2. 退还权限（如需）<br>3. 发送退款邮件 |
| `invoice.finalized` | Invoice | 发票生成（可选） | 发票生成但未支付 | **可选**：发送“待支付”提醒 |


## 订阅全生命周期流程图

```mermaid
flowchart TD
    A[用户点击「订阅」] --> B[创建 Checkout Session<br/>「mode=subscription」]
    B --> C{支付方式}
    C -->|卡、ACH| D[同步支付]
    C -->|SEPA、iDEAL| E[异步支付]

    %% 同步支付成功
    D --> F[checkout.session.completed]
    F --> G[创建 Subscription<br/>写入 subscription_id]
    G --> H[invoice.paid 「首次」]
    H --> I[激活用户权限<br/>更新 order.status = active]

    %% 异步支付成功
    E --> J[checkout.session.async_payment_succeeded]
    J --> K[invoice.paid 「首次」]
    K --> I

    %% 异步支付失败
    E --> L[checkout.session.async_payment_failed]
    L --> M[标记 order.status = failed<br/>发送失败邮件]

    %% 续订周期
    I --> N[周期结束前 3 天]
    N --> O[invoice.upcoming]
    O --> P[发送续订提醒邮件<br/>含 invoice.hosted_invoice_url]

    N --> Q[周期结束]
    Q --> R{支付成功?}
    R -->|是| S[invoice.paid]
    S --> T[更新付费周期<br/>发送续订成功邮件]
    R -->|否| U[invoice.payment_failed]
    U --> V[标记订阅为 past_due<br/>启动补救流程（dunning）]

    %% 升降级
    W[用户点击「升级」] --> X[stripe.subscriptions.update<br/>proration_behavior=create_prorations]
    X --> Y[立即生效?] 
    Y -->|是| Z[customer.subscription.updated]
    Z --> AA[更新用户计划<br/>发送升级成功邮件]
    Y -->|否「周期末」| AB[pending_update 创建]
    AB --> AC[周期结束]
    AC --> AD[customer.subscription.pending_update_applied]
    AD --> AA
    AC --> AE[支付失败?]
    AE -->|是| AF[customer.subscription.pending_update_expired]
    AF --> AG[恢复原计划<br/>发送升级失败邮件]

    %% 取消订阅
    AH[用户点击「取消」] --> AI[stripe.subscriptions.update「cancel_at_period_end=true」]
    AI --> AJ[customer.subscription.updated]
    AJ --> AK[标记为 cancel_at_period_end]
    AK --> AL[周期结束]
    AL --> AM[customer.subscription.deleted]
    AM --> AN[停用权限<br/>发送取消确认邮件]

    %% 退款（任意时间）
    AO[管理员发起退款] --> AP[stripe.refunds.create]
    AP --> AQ[charge.refunded]
    AQ --> AR[更新 order.refunded_at<br/>发送退款邮件]
```

## 即付模式全生命周期流程图

```mermaid
flowchart TD
    B1[用户点击「立即购买」] --> B2[创建 Checkout Session<br/>「mode=payment」]
    B2 --> B3{支付方式}
    B3 -->|卡| B4[同步支付]
    B3 -->|SEPA| B5[异步支付]

    B4 --> B6[checkout.session.completed]
    B6 --> B7[标记 order.status = paid<br/>发送购买成功邮件]

    B5 --> B8[checkout.session.async_payment_succeeded]
    B8 --> B7

    B5 --> B9[checkout.session.async_payment_failed]
    B9 --> B10[标记 order.status = failed<br/>发送失败邮件]

    %% 退款
    B11[管理员退款] --> B12[stripe.refunds.create]
    B12 --> B13[charge.refunded]
    B13 --> B14[更新 order.refunded_at<br/>发送退款邮件]
```

## 幂等性控制

1. checkout.session.completed / checkout.session.async_payment_succeeded：已通过订单状态与 paymentStatus 拦截重复处理，重复事件不会再次分配积分或更新订单
2. checkout.session.async_payment_failed：会先检查订单是否已成功，再将状态置为 failed，重复事件安全
3. invoice.paid（首次开通）：只更新发票相关字段，重复事件写入相同值，可视为幂等
4. invoice.paid（续费成功）：校验发票ID，同一张发票不允许重复生成续费订单、累加积分、记 credit_usage
5. invoice.payment_failed（续费失败）：校验发票ID，同一张发票不允许重复生成失败订单与 usage 记录，需要幂等保护
6. charge.refunded：订单状态校验、积分安全扣减与订阅取消逻辑，重复退款事件不会再产生额外影响
7. customer.subscription.created，主要做状态覆盖或简单更新，当前逻辑基本幂等
8. customer.subscription.updated，主要做状态覆盖或简单更新，当前逻辑基本幂等
9. customer.subscription.deleted，主要做状态覆盖或简单更新，当前逻辑基本幂等
10. payment_intent.succeeded，主要做状态覆盖或简单更新，当前逻辑基本幂等
11. payment_intent.payment_failed，主要做状态覆盖或简单更新，当前逻辑基本幂等
