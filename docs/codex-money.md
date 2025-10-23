# Money Price 价格卡片：设计与实现理解笔记

## 1. 组件分层总览
- **服务端组件 `money-price.tsx`**：在服务器端构造展示所需的文本与默认价格信息，负责渲染静态 DOM 结构（标题、价格卡骨架、计费切换按钮、按钮占位符等）。
- **客户端组件 `money-price-interactive.tsx`**：挂载在服务端输出的 DOM 之上，注入交互行为（计费周期切换、价格更新、按钮 Portal、工具提示等）以及用户态判断。
- **按钮客户端组件 `money-price-button.tsx`**：独立封装按钮渲染与行为，依据 `UserContext` 与 `billingType` 决定可见性、禁用状态和点击行为。
- **配置与类型**：`money-price-config-util.ts` 提供在当前激活支付供应商下定位价格计划的工具函数；`money-price-types.ts` 定义所有核心类型；业务层配置位于 `apps/ddaas/src/lib/money-price-config.ts`。

## 2. 数据来源与注入流程
1. **国际化文案**：服务端组件通过 `getTranslations` 读取 `moneyPrice` 命名空间，获得标题、副标题、`billingSwitch` (选项与默认键)、各计划的特性列表、按钮文案。
2. **价格配置**：调用 `getActiveProviderConfig(config)` 提取当前支付供应商（默认 `stripe`）的 `products` 配置，也就是 `free/pro/ultra` 下的 `monthly/yearly` 价格数据。
3. **服务端渲染输出**：
   - 根据默认计费周期渲染当前价格、单位、折扣徽标等。
   - 为每个计划渲染 `<div data-button-placeholder="planKey">` 作为按钮占位符。
   - 渲染带 `data-billing-button` 标记的月付/年付按钮，供客户端挂载事件。
4. **客户端增强**：
   - `MoneyPriceInteractive` 接收服务端传入的 `data`、`config`、`upgradeApiEndpoint` 等参数。
   - 通过指纹上下文 (`useFingerprintContextSafe`) + Clerk 用户信息同步用户登录状态与订阅信息。
   - 根据 `xSubscription.priceId` 与配置匹配当前用户订阅计划，从而产出 `UserState`。
   - 通过 DOM 查询更新价格文本/单位/折扣，利用 Portal 将 `MoneyPriceButton` 渲染到对应占位符。

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
- **默认值确定**：
  - 服务端：根据翻译配置中的 `billingSwitch.defaultKey`（目前为 `yearly`）渲染初始样式与文案。
  - 客户端：`billingType` state 懒初始化时尝试读取 `fingerprintContext.xSubscription.priceId`，若匹配任一 *年付* priceId 则返回 `yearly`，否则为 `monthly`；若指纹数据尚未就绪则退回 `defaultKey`。
- **按钮外观切换**：
  - 通过 `updateButtonStyles` 手动覆盖 `className` 实现当前按钮高亮（使用 `cn` 拼接 Tailwind 样式）。
  - `useEffect` 安装 `click` 事件监听，将 `setBillingType` 与 `updatePriceDisplay/updateDiscountInfo/updateButtonStyles` 串联在一起。
- **价格/折扣 DOM 更新**：
  - `updatePriceDisplay` 遍历三种 plan，利用 `document.querySelector('[data-price-value="planKey"]')` 逐个更新金额、单位、划线原价与折扣徽标。
  - `updateDiscountInfo` 专门处理卡片顶部的折扣提示区，根据当前计费类型和配置中的 `discountPercent` 判断是否显示徽标。
- **Portal 挂载**：
  - `useEffect` (依赖 `data.plans`、`userContext`、`billingType` 等) 每次重新生成 `ReactDOM.createPortal` 列表，将按钮渲染进对应占位节点。
- **工具提示**：
  - 另一个 `useEffect` 为每个带 tooltip 的特性项注册鼠标事件，更新 `tooltip` state，并在根节点渲染一个浮层。

## 5. 已知问题梳理
- **月付用户默认展示年付按钮**：首屏指纹数据缺失时，客户端无法在初始化阶段识别真实付费周期，导致 `billingType` 落在翻译默认值；服务端渲染又直接给年付按钮加高亮样式。需在指纹数据加载之后重新计算，并驱动受控渲染。
- **DOM 操作较重**：多处直接通过 `querySelector` 修改内容或 class，导致状态来源分散，难以扩展新的计费模式，也不利于 React 渲染一致性。
- **按钮事件手动管理**：计费切换按钮使用原生事件监听，必须在 effect 中清理，存在遗漏风险。
- **subscriptionType 字段未使用**：目前 `userContext.subscriptionType` 始终通过 priceId 文本包含判断，尚未被消费；若未来直接使用，需改为基于配置映射。
- **Portal 依赖 DOM 查询**：按钮挂载依赖 `data-button-placeholder` 查询，不容易在 SSR 或骨架加载场景下做细粒度控制。

## 6. OneTime 扩展设计与实现方案

### 6.1 核心设计目标
**OneTime 即付模式特点**：
- 显示积分包价格卡片，与订阅卡片共用 UI 结构，通过翻译配置差异化文案
- 后端 API 根据价格 ID 自动识别计费类型，前端调用接口保持一致
- 按钮逻辑简化：匿名用户显示登录引导，登录用户统一显示购买按钮
- 积分包购买与订阅状态独立，任何用户都可购买积分补充

### 6.2 架构重构核心原则

#### 6.2.1 移除硬编码约束
**问题识别**：现有代码多处硬编码 `'monthly' | 'yearly'` 枚举，阻碍 OneTime 扩展：
- UI 过滤逻辑强制排除非标准计费类型
- 类型定义限制计费周期选择范围
- 默认值回退逻辑忽略新增计费类型
- 价格检测机制无法处理积分包产品

**重构方案**：
- 类型系统从硬编码枚举改为动态字符串类型
- UI 逻辑从固定过滤改为配置驱动过滤
- 数据结构支持任意计费类型的动态扩展

#### 6.2.2 配置与产品概念分离
**设计思想**：将订阅产品与积分包产品在配置层面清晰分离，避免概念混淆：

```
PaymentProviderConfig {
  subscriptionProducts: {     // 订阅模式产品
    free/pro/ultra: {
      plans: { monthly, yearly }
    }
  },
  creditPackProducts: {       // 积分包产品
    small/medium/large: {
      priceId, amount, credits
    }
  }
}
```

**映射策略**：UI 层面保持三卡片结构（free/pro/ultra），底层通过映射关系连接：
- onetime + free → small 积分包
- onetime + pro → medium 积分包
- onetime + ultra → large 积分包

#### 6.2.3 翻译结构重组
**分离原则**：subscription 和 credits 计划在翻译文件中独立配置：

```json
{
  "moneyPrice": {
    "subscription": {
      "plans": [/* 订阅计划配置 */]
    },
    "credits": {
      "plans": [/* 积分包计划配置 */]
    }
  }
}
```

**动态选择逻辑**：服务端组件根据 `enabledBillingTypes` 参数智能选择显示哪套翻译配置。

### 6.3 核心技术实现

#### 6.3.1 类型系统重构
- `money-price-types.ts`：从硬编码联合类型改为动态字符串类型
- 新增 `enabledBillingTypes` 和 `mode` 属性支持灵活配置
- 产品配置结构支持任意计费类型的 Record 结构

#### 6.3.2 服务端数据流重构
- `money-price.tsx`：实现动态计划选择逻辑，根据计费类型配置选择对应翻译
- 优先级：混合模式优先显示订阅，回退显示积分包
- 向后兼容：未配置时保持现有行为

#### 6.3.3 客户端交互重构
- `money-price-interactive.tsx`：移除硬编码过滤，改为配置驱动
- 动态价格检测：同时支持订阅产品和积分包产品的价格 ID 匹配
- 兼容性处理：访问配置时使用 fallback 逻辑确保稳定性

#### 6.3.4 按钮逻辑分离
- `money-price-button.tsx`：新增 OneTime 特定按钮逻辑
- 订阅模式：基于用户订阅状态决定按钮显示
- OneTime 模式：简化逻辑，登录用户统一显示购买按钮

#### 6.3.5 配置工具函数统一
- `money-price-config-util.ts`：统一 `getProductPricing` 函数逻辑
- 自动识别计费类型并从对应产品配置中获取价格信息
- 支持 onetime 到积分包的自动映射

### 6.4 组件使用模式

#### 6.4.1 场景化配置
```typescript
// 纯订阅模式
<MoneyPrice enabledBillingTypes={['monthly', 'yearly']} />

// 纯积分包模式
<MoneyPrice enabledBillingTypes={['onetime']} />

// 混合模式
<MoneyPrice enabledBillingTypes={['monthly', 'yearly', 'onetime']} />
```

#### 6.4.2 向后兼容
- 不传 `enabledBillingTypes` 时保持现有的 monthly/yearly 行为
- 现有翻译配置继续有效，新增配置可选渐进迁移

### 6.5 实施成果与验证

#### 6.5.1 核心问题解决
- ✅ 移除所有硬编码计费类型约束
- ✅ 实现配置驱动的动态计费类型支持
- ✅ 分离订阅与积分包配置概念，提升可读性
- ✅ 统一配置访问逻辑，避免重复实现

#### 6.5.2 扩展性提升
- 支持任意新计费类型的快速添加
- 翻译配置结构化，易于维护和本地化
- 组件使用灵活，适配不同业务场景需求

### 6.6 设计价值与影响
**架构价值**：从硬编码枚举架构升级为配置驱动架构，显著提升了系统的扩展性和维护性。

**业务价值**：OneTime 模式为用户提供灵活的积分购买方式，与订阅模式形成互补，满足不同用户的付费偏好。

**技术债务清理**：在实现新功能的同时，系统性地解决了现有代码中的硬编码问题，提升了整体代码质量。

## 7. 总结
Money Price 方案在宏观上延续了“服务端骨架 + 客户端增强”的模式，利用配置与类型体系支撑多语言、多支付供应商与多产品层级。当前的主要问题集中在客户端交互层：对 DOM 的直接操控和初始状态推断不够稳健。后续针对 OneTime 扩展以及现有 bug 修复，最好先完成状态与渲染逻辑的受控化改造，从而确保新的计费类型和用户态逻辑能够平滑嵌入。
