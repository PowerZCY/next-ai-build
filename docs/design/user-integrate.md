## 2. 用户系统

以下场景涵盖了匿名用户和注册用户的完整生命周期，重点关注从匿名用户到注册用户、注销后再次成为匿名用户，以及再次注册的流程。

## 2.1 核心场景

### 场景 2.1：匿名用户初次访问
- **描述**：用户首次访问平台，未注册，系统通过 Fingerprint 识别其设备。
- **流程**：
  1. 用户访问平台，前端组件通过 Fingerprint 工具包生成唯一的 `fingerprint_id`，并进行Local存储，后续API请求会携带该请求头。
  2. 系统在 `Users` 表中创建一条记录，生成唯一的 `user_id`, `status=anonymous`，`email` 字段为空，`fingerprint_id` 记录设备标识。
  3. 系统分配 x 个免费积分，更新 `Credits` 表（`user_id` 关联，`balance_free = x`, `total_free_limit = x`）。
  4. 在 `CreditAuditLog` 表中插入记录留痕，`operation_type` 为 `system_gift`, `credit_type` 为 `free`。
  5. 在`Subscriptions`表中初始化`status=incomplete`的初始化订阅记录。
  6. 用户使用免费积分访问功能，系统记录在 `CreditAuditLog` 表（`operation_type` 为 `consume`, `credit_type` 为 `free`）。
  7. 如果积分耗尽，提示用户注册或购买积分。
- **结果**：匿名用户获得 `user_id` 和有限的免费积分，数据已与 `fingerprint_id` 关联。

### 场景 2.2：匿名用户注册
- **描述**：匿名用户决定注册为正式用户。
- **流程**：
  1. 用户在Clerk注册组件中提交信息，可通过邮箱|第三方账号完成注册： 自动携带必须参数`fingerprint_id`到Clerk后端服务。
  2. CLerk系统根据用户注册信息里的email参数来判断是否是新建用户，如新建用户则会发送`user.created`事件
  3. 系统提取并验证 `fingerprint_id`，在DB找到对应的 `user_id`。
  4. 更新 `Users` 表，将 `status=registered`,`email` 和其他注册信息（如密码哈希）写入已有记录。
  5. 系统分配 y 个免费积分，更新 `Credits` 表（`user_id` 关联，`balance_free = y`, `total_free_limit = y`）。
  6. 在 `CreditAuditLog` 表中插入记录留痕，`operation_type` 为 `system_gift`, `credit_type` 为 `free`。
  7. 用户可选择订阅计划或购买积分，触发 `Subscriptions` 或 `Transactions` 表更新。
  8. 特殊情况：
    - 同一设备使用不同email注册多个账号，Clerk会发送多个`user.created`事件，本系统支持一个`fingerprint_id`对应多个clerkUserId
    - 同一设备使用相同email注册相同账号，Clerk会自动识别转登录
    - 不同设备登录同一个email账号，一切以登录后的clerk用户信息为准进行查询
  9. 核心：fingerprint_id只在clerk未登录时有效，登录后数据ID参考都切换为clerk用户信息
- **结果**：匿名用户转换为注册用户，保留原有 `user_id`，数据连续性得以保持。

### 场景 2.3：注册用户登录
- **描述**：注册用户通过电子邮件和密码或 SSO 登录。
- **流程**：
  1. 用户通过Clerk登录组件提交登录凭证（电子邮件/密码或 SSO 令牌）。
  2. Clerk系统验证凭证，本系统可使用Clerk前端或后端SDK直接调用方法鉴权。
  3. 鉴权不通过则重定向到登录，鉴权通过则去DB查找数据。
  4. 系统返回用户数据（如积分余额、订阅状态），从 `Credits` 和 `Subscriptions` 表查询。
- **结果**：用户获得完整功能访问权限，界面显示其积分和订阅信息。

### 场景 2.4：用户注销（删除账户）
- **描述**：注册用户选择删除账户，恢复匿名状态。
- **流程**：
  1. 用户通过Clerk用户管理组件来注销账户。
  2. Clerk后端验证用户身份（可能需要密码或 SSO 验证），执行成功则发送`user.deleted`事件。
  3. 本系统标记 `Users` 表中的记录为已删除（软删除，设置 `status=deleted`，`email = NULL`，保留 `user_id` 和 `fingerprint_id`），或完全删除记录（硬删除，视 GDPR 要求）。
  4. 关联数据处理：
     - 清理`Subscriptions`、`Credits`、 和 `CreditAuditLog` 表中数据。
     - 更新`CreditAuditLog` 操作留痕。
  5. 系统为用户生成新的 `fingerprint_id`，重新作为匿名用户。
- **结果**：用户恢复匿名状态，数据根据策略保留或删除。

### 场景 2.5：匿名用户再次注册
- **描述**：注销后的匿名用户再次注册。
- **流程**：
  1. 用户访问平台，系统识别新的 `fingerprint_id`。
  2. 使用新的`fingerprint_id`，clerk用户，其余均与普通注册用户一样


### 2.2 用户注册流程图

```mermaid
flowchart TD
    A[接收 user.created 事件] --> B["提取<br/>clerkUserId, email, fingerprintId"]

    B --> C{"按 fingerprintId<br/>查询已有用户?"}

    C --> D{结果为空?}
    D -- 是 --> E[错误: 无效 fingerprintId] --> Z[结束]
    D -- 否 --> F{存在相同 email?}

    F -- 是 --> G{"clerkUserId<br/>是否一致?"}
    G -- 否 --> H[更新 clerkUserId] --> Z
    G -- 是 --> I[跳过: 已存在] --> Z

    F -- 否 --> J{"存在匿名用户?<br/>email=null<br/>clerkUserId=null<br/>status=ANONYMOUS"}

    J -- 是 --> K["升级为注册用户<br/>设置 email + clerkUserId"] --> Z

    J -- 否 --> L["创建新注册用户<br/>绑定 clerkUserId<br/>与 email"] --> Z

    %% === 样式定义（修复：end 改为 endNode）===
    classDef start fill:#4CAF50, color:white, stroke:#388E3C
    classDef endNode fill:#2196F3, color:white, stroke:#1976D2
    classDef error fill:#F44336, color:white, stroke:#D32F2F
    classDef action fill:#FF9800, color:white, stroke:#F57C00
    classDef upgrade fill:#9C27B0, color:white, stroke:#7B1FA2
    classDef create fill:#00BCD4, color:white, stroke:#0097A7

    %% === 应用样式 ===
    class A start
    class Z endNode
    class E error
    class H,I action
    class K upgrade
    class L create
 ```

