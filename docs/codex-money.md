# Money Price 价格卡片：设计与实现文档

## 1. 组件分层总览

```
money-price/
├── money-price.tsx              # 服务端组件，处理SSR、翻译、静态渲染
├── money-price-interactive.tsx  # 客户端组件，处理交互逻辑
├── money-price-config.ts        # 配置文件，包含价格和产品信息
├── money-price-types.ts         # 类型定义
└── money-price-button.tsx       # 按钮组件，封装动态逻辑
```

- **服务端组件 `money-price.tsx`**：在服务器端构造展示所需的文本与价格信息，支持动态模式选择（订阅/积分包/混合），负责渲染静态 DOM 结构和计费类型切换按钮。
- **客户端组件 `money-price-interactive.tsx`**：注入交互行为（计费周期切换、动态价格更新、用户状态检测、工具提示等），支持配置驱动的计费类型过滤。
- **按钮客户端组件 `money-price-button.tsx`**：独立封装按钮渲染与行为，支持订阅模式和OneTime模式的不同逻辑，依据 `UserContext` 与 `billingType` 决定按钮状态。
- **配置与类型**：
  - `money-price-config-util.ts`：统一价格定位工具函数，支持订阅产品和积分包产品
  - `money-price-types.ts`：动态类型定义，支持任意计费类型扩展
  - `apps/ddaas/src/lib/money-price-config.ts`：业务层配置，分离订阅产品和积分包产品

## 2. 数据来源与注入流程
1. **国际化文案**：服务端组件通过 `getTranslations` 读取 `moneyPrice` 命名空间，支持分离的 `subscription` 和 `credits` 配置，获得标题、副标题、`billingSwitch`（支持 monthly/yearly/onetime）、各计划的特性列表、按钮文案。
2. **价格配置**：调用 `getActiveProviderConfig(config)` 提取当前支付供应商的配置，支持分离的 `subscriptionProducts`（F1/P2/U3 订阅产品）和 `creditPackProducts`（F1/P2/U3 积分包产品）。
3. **动态模式选择**：
   - 根据 `enabledBillingTypes` 参数智能选择显示订阅计划或积分包计划
   - 混合模式下优先显示订阅计划，支持动态切换
   - 向后兼容：未配置时保持 monthly/yearly 行为
4. **服务端渲染输出**：
   - 根据选定的计费类型和计划渲染价格卡片结构
   - 支持 F1/P2/U3 统一产品键映射
   - 渲染计费类型切换按钮（monthly/yearly/onetime）
5. **客户端增强**：
   - `MoneyPriceInteractive` 接收服务端传入的 `data`、`config`、`enabledBillingTypes` 等参数
   - 配置驱动的计费类型过滤，移除硬编码约束
   - 支持订阅产品和积分包产品的统一价格检测
   - 动态用户状态判断和按钮渲染

## 3. 用户态与按钮行为
- `UserState` 枚举包括 `Anonymous`、`FreeUser`、`ProUser`、`UltraUser`。
- `getUserState()`：
  1. 若无指纹上下文或无 Clerk 登录用户 → `Anonymous`。
  2. 若未订阅或订阅非激活 → `FreeUser`。
  3. 通过 `priceId` 与配置中的 `pro` / `ultra` 月付、年付 priceId 对比，判定为 `ProUser` 或 `UltraUser`。
- **付费阶梯（价格从低到高）**：`Free < Month·Pro < Month·Ultra < Year·Pro < Year·Ultra`。升级只允许沿此顺序向上，禁止走回价格更低的组合。
- `MoneyPriceButton` 根据 `UserContext` 渲染：
  - Anonymous：六张卡统一显示 Get Started / Get Pro / Get Ultra。
  - FreeUser：Month·Free 与 Year·Free → Current Plan；其余四张卡 → Upgrade。
  - ProUser (monthly)：Month·Pro → Current Plan；Month·Ultra、Year·Pro、Year·Ultra → Upgrade；两张 Free 隐藏（价格更低）。
  - ProUser (yearly)：Year·Pro → Current Plan；Year·Ultra → Upgrade；其它卡片（含 Month·Pro、Month·Ultra、两张 Free）隐藏（价格更低）。
  - UltraUser (monthly)：Month·Ultra → Current Plan；Year·Ultra → Upgrade；其它全部隐藏（价格更低）。
  - UltraUser (yearly)：Year·Ultra → Current Plan；其它五张隐藏（价格更低）。
- `onUpgrade` 请求携带 `priceId/plan/billingType/provider`，默认调用 `upgradeApiEndpoint` (post→`/api/subscriptions/create` 等)。若未提供接口则跳转首页。

### 规则总结

- 整体升级路径：`Free → Month·Pro → Month·Ultra → Year·Pro → Year·Ultra`，任一用户状态下只有当目标卡片位于该序列中更靠后的节点时，按钮才会显示 `Upgrade`。

| 用户状态 | 可见卡片 | 按钮行为 | 隐藏原因 |
| --- | --- | --- | --- |
| Anonymous | 全部 6 张 | Get Started / Get Pro / Get Ultra | – |
| FreeUser | Month·Free、Year·Free → Current Plan<br>Month·Pro、Year·Pro、Month·Ultra、Year·Ultra → Upgrade | – |
| MonthProUser | Month·Pro → Current Plan<br>Month·Ultra、Year·Pro、Year·Ultra → Upgrade | 两张 Free → 隐藏（价格更低） |
| MonthUltraUser | Month·Ultra → Current Plan<br>Year·Pro、Year·Ultra → Upgrade | Month·Pro、两张 Free → 隐藏（价格更低）
| YearProUser | Year·Pro → Current Plan<br>Year·Ultra → Upgrade | Month·Pro、Month·Ultra、两张 Free → 隐藏（价格更低） |
| YearUltraUser | Year·Ultra → Current Plan | 其它五张 → 隐藏（价格更低） |

### 升级流程图

```mermaid
flowchart LR
      classDef current fill:#4ade80,stroke:#15803d,color:#0f172a,stroke-width:2px;
      classDef upgrade fill:#fda4af,stroke:#be123c,color:#831843,stroke-width:2px;

      subgraph Anonymous["Anonymous (未登录)"]
          direction LR
          A_MF([Month·Free<br/>Get Started]):::upgrade
          A_YF([Year·Free<br/>Get Started]):::upgrade
          A_MP([Month·Pro<br/>Get Pro]):::upgrade
          A_YP([Year·Pro<br/>Get Pro]):::upgrade
          A_MU([Month·Ultra<br/>Get Ultra]):::upgrade
          A_YU([Year·Ultra<br/>Get Ultra]):::upgrade
      end

      subgraph Free["FreeUser (已登录未订阅)"]
          direction LR
          F_MF([Month·Free<br/>Current Plan]):::current
          F_YF([Year·Free<br/>Current Plan]):::current
          F_MP([Month·Pro<br/>Upgrade]):::upgrade
          F_YP([Year·Pro<br/>Upgrade]):::upgrade
          F_MU([Month·Ultra<br/>Upgrade]):::upgrade
          F_YU([Year·Ultra<br/>Upgrade]):::upgrade
      end

      subgraph ProM["MonthProUser"]
          direction LR
          PM_MP([Month·Pro<br/>Current Plan]):::current
          PM_YP([Year·Pro<br/>Upgrade]):::upgrade
          PM_MU([Month·Ultra<br/>Upgrade]):::upgrade
          PM_YU([Year·Ultra<br/>Upgrade]):::upgrade
      end

      subgraph ProY["YearProUser"]
          direction LR
          PY_YP([Year·Pro<br/>Current Plan]):::current
          PY_YU([Year·Ultra<br/>Upgrade]):::upgrade
      end

      subgraph UltraM["MonthUltraUser"]
          direction LR
          UM_MU([Month·Ultra<br/>Current Plan]):::current
          UM_YP([Year·Pro<br/>Upgrade]):::upgrade
          UM_YU([Year·Ultra<br/>Upgrade]):::upgrade
      end

      subgraph UltraY["YearUltraUser"]
          direction LR
          UY_YU([Year·Ultra<br/>Current Plan]):::current
      end

      %% Anonymous upgrades
      A_MF -- sign-up --> F_MF
      A_YF -- sign-up --> F_YF
      A_MP -- purchase --> PM_MP
      A_YP -- purchase --> PY_YP
      A_MU -- purchase --> UM_MU
      A_YU -- purchase --> UY_YU

      %% FreeUser upgrades
      F_MP -- upgrade --> PM_MP
      F_YP -- upgrade --> PY_YP
      F_MU -- upgrade --> UM_MU
      F_YU -- upgrade --> UY_YU

      %% MonthProUser upgrades
      PM_YP -- upgrade --> PY_YP
      PM_MU -- upgrade --> UM_MU
      PM_YU -- upgrade --> UY_YU

      %% YearProUser upgrades
      PY_YU -- upgrade --> UY_YU

      %% MonthUltraUser upgrades
      UM_YP -- upgrade --> PY_YP
      UM_YU -- upgrade --> UY_YU
```


## 4. 计费周期与价格展示逻辑
- **计费类型支持**：
  - 支持动态计费类型：`monthly`、`yearly`、`onetime` 及任意自定义类型
  - 通过 `enabledBillingTypes` 参数控制可用计费类型
  - 配置驱动的按钮渲染，移除硬编码约束
- **默认值确定**：
  - 服务端：根据翻译配置中的 `billingSwitch.defaultKey`（默认为 `yearly`）渲染初始样式
  - 客户端：动态检测用户当前订阅的计费类型，支持订阅产品和积分包产品的价格ID匹配
  - 回退机制：若检测失败则使用配置的默认值或第一个可用选项
- **动态计划切换**：
  - 根据当前 `billingType` 动态选择显示 `subscriptionPlans` 或 `creditsPlans`
  - OneTime 模式下显示积分包计划，其他模式显示订阅计划
  - 实时价格更新和折扣信息展示
- **价格展示增强**：
  - 统一的 `getProductPricing` 函数支持订阅产品和积分包产品
  - 折扣徽标智能显示：订阅模式支持百分比替换，OneTime模式直接显示文本
  - 副标题动态拼接：OneTime 模式下支持 billingSwitch subTitle + 产品 subtitle 的样式化显示
- **受控渲染优化**：
  - 移除DOM直接操作，改为React受控组件渲染
  - 统一的状态管理和数据流
  - 更好的TypeScript类型安全支持

## 5. 问题解决状态
### 已解决问题 ✅
- **硬编码计费类型约束**：已移除所有硬编码 `'monthly' | 'yearly'` 约束，支持动态计费类型扩展
- **DOM 操作过重**：已改为React受控渲染，移除直接DOM操作，提升渲染一致性
- **配置结构混乱**：已分离订阅产品和积分包产品配置，提升可读性和维护性
- **产品键映射复杂**：已统一为F1/P2/U3系统，简化配置和代码逻辑
- **翻译结构不一致**：已重构为分离的subscription和credits配置，解决运行时错误

### 待优化问题 ⏳
- **初始状态检测**：首屏指纹数据缺失时，客户端无法准确识别用户真实计费周期，可能出现短暂的状态不一致
- **SSR优化**：服务端渲染与客户端状态同步可以进一步优化，减少水合不一致的可能性
- **subscriptionType字段**：`userContext.subscriptionType` 字段的使用场景可以进一步明确和优化

## 6. OneTime 模式实现成果

### 6.1 实现特点
**OneTime 即付模式特点**：
- ✅ 显示积分包价格卡片，与订阅卡片共用 UI 结构，通过翻译配置差异化文案
- ✅ 后端 API 根据价格 ID 自动识别计费类型，前端调用接口保持一致
- ✅ 按钮逻辑简化：匿名用户显示"Get Started"登录引导，登录用户统一显示"Buy Credits"购买按钮
- ✅ 积分包购买与订阅状态独立，任何用户都可购买积分补充
- ✅ 支持智能副标题显示：billingSwitch subTitle + 样式化的产品 subtitle（如 "Pay Once + 200 Credits"）

### 6.2 架构重构成果

#### 6.2.1 ✅ 移除硬编码约束
**已解决问题**：彻底移除 `'monthly' | 'yearly'` 硬编码枚举：
- ✅ 类型系统从硬编码枚举改为动态字符串类型
- ✅ UI 逻辑从固定过滤改为配置驱动过滤
- ✅ 数据结构支持任意计费类型的动态扩展
- ✅ 价格检测机制统一支持订阅产品和积分包产品

#### 6.2.2 ✅ 配置与产品概念分离
**实现效果**：订阅产品与积分包产品在配置层面清晰分离：

```typescript
PaymentProviderConfig {
  subscriptionProducts: {     // 订阅模式产品
    F1/P2/U3: {
      plans: { monthly, yearly }
    }
  },
  creditPackProducts: {       // 积分包产品
    F1/P2/U3: {
      priceId, amount, credits
    }
  }
}
```

**映射优化**：统一为F1/P2/U3产品键，简化映射逻辑：
- ✅ onetime + F1 → F1 积分包（直接映射）
- ✅ onetime + P2 → P2 积分包（直接映射）
- ✅ onetime + U3 → U3 积分包（直接映射）

#### 6.2.3 ✅ 翻译结构重组
**实现效果**：subscription 和 credits 计划完全分离配置：

```json
{
  "moneyPrice": {
    "subscription": {
      "plans": [/* 订阅计划：F1/P2/U3 */]
    },
    "credits": {
      "plans": [/* 积分包计划：F1/P2/U3 */]
    },
    "billingSwitch": {
      "options": [
        { "key": "monthly", "name": "Monthly" },
        { "key": "yearly", "name": "Yearly" },
        { "key": "onetime", "name": "One-Time", "discountText": "Credit Pack" }
      ]
    }
  }
}
```

**智能选择逻辑**：服务端组件根据 `enabledBillingTypes` 参数自动选择合适的翻译配置。

### 6.3 核心技术实现成果

#### 6.3.1 ✅ 类型系统重构
- ✅ `money-price-types.ts`：从硬编码联合类型改为动态字符串类型
- ✅ 新增 `enabledBillingTypes` 和 `mode` 属性支持灵活配置
- ✅ 产品配置结构支持任意计费类型的 Record 结构
- ✅ 分离 `SubscriptionProductConfig` 和 `CreditPackProductConfig` 类型

#### 6.3.2 ✅ 服务端数据流重构
- ✅ `money-price.tsx`：实现 `getDataByMode()` 动态计划选择逻辑
- ✅ 智能翻译选择：根据 `enabledBillingTypes` 自动选择 subscription 或 credits 配置
- ✅ 向后兼容：未配置 `enabledBillingTypes` 时保持现有 monthly/yearly 行为
- ✅ 混合模式支持：优先显示订阅，回退显示积分包

#### 6.3.3 ✅ 客户端交互重构
- ✅ `money-price-interactive.tsx`：移除硬编码过滤，改为配置驱动
- ✅ `currentPlans` 动态切换：根据 `billingType` 在 subscriptionPlans 和 creditsPlans 间切换
- ✅ 统一 `PLAN_KEYS: ['F1', 'P2', 'U3']` 替代旧的 free/pro/ultra 映射
- ✅ 动态价格检测：同时支持订阅产品和积分包产品的价格 ID 匹配
- ✅ 智能折扣徽标：OneTime 模式直接显示 discountText，订阅模式支持百分比替换

#### 6.3.4 ✅ 按钮逻辑优化
- ✅ `money-price-button.tsx`：实现 OneTime 模式特定按钮逻辑
- ✅ 订阅模式：基于用户订阅状态决定按钮显示（Current Plan/Upgrade/隐藏）
- ✅ OneTime 模式：简化逻辑，匿名用户显示"Get Started"，登录用户显示"Buy Credits"
- ✅ 移除复杂的 planKey 映射，直接使用 F1/P2/U3 系统

#### 6.3.5 ✅ 配置工具函数统一
- ✅ `money-price-config-util.ts`：重构 `getProductPricing` 函数
- ✅ 自动识别计费类型：onetime 从 creditPackProducts 获取，其他从 subscriptionProducts 获取
- ✅ 统一的错误处理和类型安全
- ✅ 支持 F1/P2/U3 直接映射，无需复杂转换

### 6.4 组件使用模式

#### 6.4.1 ✅ 场景化配置实现
```typescript
// 纯订阅模式
<MoneyPrice enabledBillingTypes={['monthly', 'yearly']} />

// 纯积分包模式
<MoneyPrice enabledBillingTypes={['onetime']} />

// 混合模式（支持所有计费类型）
<MoneyPrice enabledBillingTypes={['monthly', 'yearly', 'onetime']} />

// 自定义组合（如只支持年付和一次性）
<MoneyPrice enabledBillingTypes={['yearly', 'onetime']} />
```

#### 6.4.2 ✅ 完整向后兼容
- ✅ 不传 `enabledBillingTypes` 时保持现有的 monthly/yearly 行为
- ✅ 现有翻译配置继续有效，新增 subscription/credits 配置可选迁移
- ✅ 现有业务代码无需修改即可正常运行

#### 6.4.3 ✅ 高级功能支持
- ✅ 智能副标题拼接：OneTime 模式下支持 "Pay Once + 200 Credits" 样式化显示
- ✅ 动态折扣徽标：订阅模式支持百分比替换，OneTime 模式直接显示配置文本
- ✅ 用户状态智能检测：自动识别用户当前订阅状态并相应调整 UI

### 6.5 实施成果验证 ✅

#### 6.5.1 核心问题全部解决
- ✅ 移除所有硬编码计费类型约束，支持任意类型扩展
- ✅ 实现完整的配置驱动架构，显著提升扩展性
- ✅ 分离订阅与积分包配置概念，大幅提升可读性和维护性
- ✅ 统一 F1/P2/U3 产品键系统，简化配置和代码逻辑
- ✅ 重构为 React 受控渲染，移除所有 DOM 直接操作

#### 6.5.2 技术架构全面升级
- ✅ TypeScript 类型安全：动态类型支持 + 完整的类型检查
- ✅ 配置结构化：清晰的产品概念分离 + 智能翻译选择
- ✅ 代码可维护性：统一的工具函数 + 清晰的数据流
- ✅ 用户体验：流畅的交互 + 智能的状态检测

### 6.6 项目价值总结

**架构价值** 🚀：
- 从硬编码枚举架构完全升级为配置驱动架构
- 显著提升系统扩展性、维护性和类型安全性
- 建立了可持续发展的技术架构基础

**业务价值** 💰：
- OneTime 模式为用户提供灵活的积分购买方式
- 与订阅模式形成完美互补，满足不同用户付费偏好
- 支持多样化的商业模式和定价策略

**技术债务清理** ⚡：
- 系统性解决现有代码中的硬编码问题
- 大幅提升整体代码质量和开发效率
- 为后续功能扩展奠定坚实基础

## 7. 总结
Money Price 价格组件已经完成从硬编码架构到配置驱动架构的全面升级。新架构在保持"服务端骨架 + 客户端增强"设计模式的基础上，实现了：

1. **完整的 OneTime 即付模式支持**：与订阅模式无缝集成，提供灵活的积分购买体验
2. **配置驱动的动态架构**：支持任意计费类型扩展，满足未来业务发展需求
3. **类型安全的代码实现**：TypeScript 全覆盖，提供优秀的开发体验
4. **清晰的概念分离**：订阅产品与积分包产品配置独立，易于理解和维护
5. **向后兼容性保证**：现有业务代码无需修改即可正常运行

该组件现已具备支撑复杂商业场景的能力，为产品的多样化定价策略提供了强大的技术支撑。
