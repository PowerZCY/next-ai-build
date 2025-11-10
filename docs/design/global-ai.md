## 订阅与积分系统产研设计文档 v1.0

本文档详细描述了一个与Stripe支付处理集成的订阅与积分系统的全面设计。该系统旨在为用户提供无缝的订阅服务、积分管理和支付体验，确保可扩展性、安全性和可维护性。设计涵盖了用户操作、数据模型、数据流、用户场景和系统时序，确保清晰度、专业性和鲁棒性。

## 1. 系统目标

- 使用户能够通过Stripe订阅计划或购买一次性积分包
- 提供用户友好的界面，用于管理订阅和查看积分余额
- 使用Fingerprint确保用户（包括匿名用户）的安全识别
- 支持灵活的订阅管理（自动续费、取消、升级、附加包）
- 维护详细的交易和积分使用历史记录
- 设计可扩展的数据模型和清晰的数据流，确保可靠性和性能
- 支持匿名用户到注册用户的完整生命周期管理
  
## 2. 里程碑

```mermaid
flowchart TB
    classDef phase fill:#F3E5F5,stroke:#AC62FD,color:#4A148C;
    classDef task fill:#E8F5E9,stroke:#66BB6A,color:#2E7D32;
    classDef parallel fill:#E8F5E9,stroke:#66BB6A,color:#2E7D32;

    %% NO.1: 规划与需求确认
    subgraph P1["NO.1: 规划与需求确认"]
        direction TB
        T1A["需求分析与优化: 产品方案, 优化用户场景/数据模型, 定义MVP范围"]:::task
        T1B["技术栈选型: 技术方案，确认后端(Node.js/Prisma), 前端(React), 数据库(PostgreSQL), 集成(Stripe/Clerk/Fingerprint/Redis)"]:::task
        T1C["风险评估: GDPR合规, 安全审计, 性能瓶颈评估"]:::task
        T1D["团队分工: 分配前后端/测试角色, 设定里程碑"]:::task
        T1A --> T1B & T1C
        T1B & T1C --> T1D
    end
    P1:::phase

    %% NO.2: 系统设计与架构
    subgraph P2["NO.2: 系统设计与架构"]
        direction TB
        T2A["数据库设计: 建模Users/Subscriptions/Credits/Transactions/CreditAuditLog/Apilog/UserBackup表, 添加索引/关系"]:::task
        T2B["API设计: 定义RESTful endpoints (订阅/积分/用户管理), 接口文档"]:::task
        T2C["数据流设计: 优化订阅购买/积分使用/退款/Clerk认证流程, 生成时序图"]:::task
        T2D["界面设计: 订阅管理UI线框, 历史记录/积分显示原型 (Figma)"]:::task
        T2E["集成设计: Stripe Webhook/Clerk Webhook/Fingerprint/Redis缓存策略"]:::task
        T2A --> T2B & T2C & T2D & T2E
    end
    P2:::phase

    %% NO.3: 后端开发 与 NO.4: 前端开发 (并行)
    subgraph P34["NO.3/NO.4: 前后端并行"]
        direction LR
        subgraph P3["NO.3: 后端开发"]
            direction TB
            T3A["数据库实现: 创建表/迁移, 实现软/硬删除逻辑"]:::task
            T3B["用户管理模块: 匿名/注册/注销逻辑, Fingerprint/Clerk集成"]:::task
            T3C["订阅与支付模块: Stripe集成, Webhook处理, 订阅CRUD/升级/取消"]:::task
            T3D["积分管理模块: 积分充值/消耗/历史记录, 事务一致性"]:::task
            T3E["API开发: 实现所有endpoints, 安全验证(JWT/Rate Limit)"]:::task
            T3F["缓存与优化: Redis集成, 缓存策略实现"]:::task
            T3A --> T3B & T3C & T3D & T3E & T3F
        end
        P3:::phase

        subgraph P4["NO.4: 前端开发"]
            direction TB
            T4A["网站模板框架配置: React App初始化, 网站Style/Blog/Legal/首页通用组件"]:::task
            T4B["用户界面: 注册/登录/注销页面, Clerk集成"]:::task
            T4C["订阅界面: 计划选择/支付重定向/历史记录显示"]:::task
            T4D["积分界面: 余额显示/使用历史/提示购买"]:::task
            T4A --> T4B & T4C & T4D
        end
        P4:::phase
    end
    P34:::parallel

    %% NO.5: 集成与测试
    subgraph P5["NO.5: 集成与测试"]
        direction TB
        T5A["系统集成: 前后端对接, Stripe/Clerk/Fingerprint测试环境集成"]:::task
        T5B["单元测试: 覆盖后端逻辑(积分扣除/订阅状态), Jest/Mocha"]:::task
        T5C["集成测试: API/Webhook/Clerk端到端测试, Postman/Cypress"]:::task
        T5D["性能/安全测试: 负载测试(JMeter), 漏洞扫描(OWASP), GDPR审计"]:::task
        T5E["用户场景测试: 模拟匿名/注册/订阅购买/即购买付/注销全流程"]:::task
        T5A --> T5B & T5C & T5D & T5E
    end
    P5:::phase

    %% NO.6: 部署与上线
    subgraph P6["NO.6: 部署与上线"]
        direction TB
        T6A["CI/CD管道: Vercel自动化构建/部署"]:::task
        T6B["环境部署: 测试环境上线, 生产环境配置"]:::task
        T6C["数据迁移: 初始数据种子, 备份策略实现"]:::task
        T6D["上线发布: 灰度发布, 监控设置(Prometheus/Sentry)"]:::task
        T6E["文档更新: API/用户手册, 运维指南"]:::task
        T6A --> T6B & T6C
        T6B & T6C --> T6D & T6E
    end
    P6:::phase

    %% NO.7: 维护与迭代
    subgraph P7["NO.7: 持续迭代维护"]
        direction TB
        T7A["监控与优化: 实时监控, 性能调优, Bug修复"]:::task
        T7B["反馈收集: 用户反馈, A/B测试新功能(多货币/促销积分)"]:::task
        T7C["版本迭代: 基于未来改进(通知/分析仪表板)"]:::task
        T7A --> T7B --> T7C
    end
    P7:::phase

    %% NO.8: 模板化升级
    subgraph P8["NO.8: 模板化升级"]
        direction TB
        T8A["通用组件: 积分订阅系统中模块化复用（如用户管理、订阅管理、积分系统、Webhook）"]:::task
        T8B["提取公共UI组件: 将通用组件沉淀到@windrun-huaiin工具包中"]:::task
        T8C["模板化升级: 创建脚本命令，支持第三方应用一键接入与升级积分订阅系统"]:::task
        T8A --> T8B & T8C
    end
    P8:::phase

    %% 阶段连接
    Start((开始)) --> P1
    P1 --> P2
    P2 --> P34
    P34 --> P5
    P5 --> P6
    P6 --> P7
    P7 --> P8
    P8 --> End((结束/持续))
```



## 3. 关键考虑

### 3.1 数据隔离
- 匿名用户通过 `user_id` 和 `fingerprint_id` 唯一关联。
- 用户注销软删除

### 3.2 安全性
- **Fingerprint**：通过限制每设备积分分配，防止免费积分滥用。
- **Stripe Webhook**：验证签名以确保真实性。
- **数据隐私**：加密敏感数据（例如，`pay_session_id`）并符合GDPR。
- 使用 `fingerprint_id` 防止匿名用户滥用免费积分。
- 注销时需身份验证（密码或 SSO），防止恶意操作。

### 3.3 可扩展性
- **数据库索引**：优化`user_id`、`fingerprint_id`和`pay_session_id`的查询。
- **缓存加速**：使用Redis缓存活跃用户的 `Credits` 和 `Subscriptions` 数据。
- **异步处理**：异步处理Stripe Webhook，避免用户操作延迟。
- **负载均衡**：使用负载均衡器将流量分配到多个后端服务器。

### 3.4 用户体验
- **清晰提示**：当积分耗尽时，引导匿名用户注册。
- **透明历史记录**：提供详细的交易和使用日志。
- **响应式界面**：确保订阅界面适配移动设备。


## 4.模块设计

|模块|文档链接|
|-----|-----------|
|用户系统|B|
|数据模型|A|
|状态流转|D|
|FingerprintContext|E|
|价格组件|F|
|积分组件|G|
|Webhook组件|J|


## 5. 未来改进
- **多货币支持**：通过Stripe支持多种货币支付。
- **促销积分**：提供限时促销积分用于营销活动。
- **通知**：为低积分余额或订阅变化发送电子邮件/短信提醒。
- **分析仪表板**：为用户提供积分使用模式的洞察。
- **API访问**：提供API供开发者集成订阅系统（参考 https://x.ai/api）。

## 参考

- Stripe文档：https://stripe.com/docs
- Stripe Webhook文档：https://stripe.com/docs/webhooks
- Fingerprint文档：https://fingerprint.com/docs
- Mermaid语法：https://mermaid.js.org/syntax/sequenceDiagram.html
- 示例UI灵感：https://pikttochart.com/generative-ai/editor/ 

