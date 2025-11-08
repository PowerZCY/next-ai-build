# 匿名用户 Fingerprint 使用指南

本文档说明如何在应用中使用fingerprint功能来管理匿名用户。

## 功能概述

- **自动fingerprint生成**：为每个访问者生成唯一的浏览器指纹ID
- **匿名用户管理**：自动创建匿名用户记录并分配50免费积分
- **数据持久化**：fingerprint存储在localStorage和cookie中
- **中间件集成**：自动在请求中识别和传递fingerprint ID
- **Clerk集成**: 提供适配组件完成Clerk用户数据传递

## 核心组件

### 1. Fingerprint客户端工具库

```typescript
import { getOrGenerateFingerprintId, createFingerprintHeaders } from '@third-ui/clerk/fingerprint';

// 获取或生成fingerprint ID
const fpId = await getOrGenerateFingerprintId();

// 创建包含fingerprint的fetch headers
const headers = await createFingerprintHeaders();
```

### 2. React Hook

```typescript
import { useFingerprint } from '@third-ui/clerk/fingerprint';

function MyComponent() {
  const config = {
    apiEndpoint: '/api/user/anonymous/init',
    autoInitialize: true
  };
  
  const { 
    fingerprintId, 
    anonymousUser, 
    credits, 
    isLoading,
    isInitialized,
    error,
    initializeAnonymousUser,
    refreshUserData
  } = useFingerprint(config);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <p>Fingerprint: {fingerprintId}</p>
      <p>User ID: {anonymousUser?.userId}</p>
      <p>Credits: {credits?.totalBalance}</p>
      <p>Initialized: {isInitialized ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### 3. Context Provider

```typescript
import { FingerprintProvider, useFingerprintContext } from '@third-ui/clerk/fingerprint';

function App() {
  const config = {
    apiEndpoint: '/api/user/anonymous/init',
    autoInitialize: true
  };
  
  return (
    <FingerprintProvider config={config}>
      <MyApp />
    </FingerprintProvider>
  );
}

function MyApp() {
  const { 
    fingerprintId,
    anonymousUser, 
    credits,
    isLoading,
    isInitialized,
    error,
    initializeAnonymousUser,
    refreshUserData
  } = useFingerprintContext();
  // 使用fingerprint数据
}
```

## API端点

### 初始化匿名用户

```bash
# 创建新匿名用户
POST /api/user/anonymous/init
Content-Type: application/json
X-Fingerprint-Id: fp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

{
  "fingerprintId": "fp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}

# 响应
{
  "success": true,
  "user": {
    "userId": "uuid",
    "fingerprintId": "fp_xxx",
    "status": "anonymous",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "credits": {
    "balanceFree": 50,
    "balancePaid": 0,
    "totalBalance": 50
  },
  "isNewUser": true
}
```

### 获取匿名用户信息

```bash
# 获取现有用户信息
GET /api/user/anonymous/init?fingerprintId=fp_xxx
X-Fingerprint-Id: fp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 中间件集成

中间件自动处理fingerprint ID的提取和验证：

```typescript
// middleware.ts 会自动：
// 1. 从请求headers、cookies中提取fingerprint ID
// 2. 在响应中设置fingerprint ID header
// 3. 记录调试日志
```

## 使用场景

### 1. 应用初始化

FingerprintProvider已经集成到应用的layout中：

```typescript
// src/app/[locale]/(home)/layout.tsx - 主页layout
// src/app/[locale]/(clerk)/layout.tsx - Clerk页面layout

return (
  <ClerkProviderClient locale={locale}>
    <FingerprintProvider autoInitialize={true}>
      <HomeLayout {...customeOptions}>
        {children}
      </HomeLayout>
    </FingerprintProvider>
  </ClerkProviderClient>
);
```

**已挂载位置**：
- ✅ **主页路由** (`/[locale]/(home)/*`): 包括首页、博客、法律页面等
- ✅ **Clerk路由** (`/[locale]/(clerk)/*`): 包括登录、注册、用户管理页面
- 🔄 **自动初始化**: `autoInitialize={true}` 用户访问时自动创建匿名用户

### 2. 用户状态显示

应用已提供了 `FingerprintStatus` 组件来显示用户状态：

```typescript
// 使用现成的状态组件
import { FingerprintStatus } from '@/components/FingerprintStatus';

function MyPage() {
  return (
    <div>
      <h1>我的页面</h1>
      <FingerprintStatus />
    </div>
  );
}
```


## 数据流程详解

### FingerprintID生成和降级策略详解

#### 客户端指纹生成流程

1. **FingerprintJS正常流程**：
   ```typescript
   // 直接导入FingerprintJS (客户端代码无需动态导入)
   import FingerprintJS from '@fingerprintjs/fingerprintjs';
   
   // 使用FingerprintJS收集浏览器特征
   const fp = await FingerprintJS.load();
   const result = await fp.get();
   const fingerprintId = `fp_${result.visitorId}`;
   // 结果例如: fp_abc123def456gh789ijk
   ```

2. **客户端降级策略**：
   ```typescript
   // 当FingerprintJS失败时（网络问题、浏览器不支持等）
   catch (error) {
     console.warn('Failed to generate fingerprint with FingerprintJS:', error);
     const fallbackId = `fp_fallback_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
     // 结果例如: fp_fallback_1692345678901_x7k9m2n4p
   }
   ```

3. **服务端环境降级**（理论上不会发生）：
   ```typescript
   // ⚠️ 注意：在当前架构下，此情况实际不会发生
   // 因为fingerprint生成只在客户端useEffect中执行
   return `fp_server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
   // 结果例如: fp_server_1692345678901_x7k9m2n4p
   ```

#### 降级策略触发条件

| 场景 | 触发条件 | 生成的ID格式 | 持久性 | 实际发生 |
|------|----------|-------------|--------|----------|
| **正常指纹** | FingerprintJS成功收集浏览器特征 | `fp_abc123def456` | ✅ 高 - 基于真实浏览器特征 | ✅ 常见 |
| **客户端降级** | FingerprintJS加载失败、网络错误、浏览器不支持 | `fp_fallback_timestamp_random` | ⚠️ 中 - 存储在localStorage/cookie | ⚠️ 偶尔 |
| **服务端降级** | 在Node.js环境中生成（理论情况） | `fp_server_timestamp_random` | ❌ 低 - 每次都是新ID | ❌ 不会发生 |

#### 服务端提取和验证逻辑

```typescript
// extractFingerprintId 优先级顺序
export function extractFingerprintId(headers, cookies, query) {
  // 1. 优先从HTTP header获取 (X-Fingerprint-Id)
  const headerValue = headers.get('x-fingerprint-id');
  if (headerValue && isValidFingerprintId(headerValue)) {
    return headerValue;
  }
  
  // 2. 从cookie获取 (fingerprint_id)
  const cookieValue = cookies.fingerprint_id;
  if (cookieValue && isValidFingerprintId(cookieValue)) {
    return cookieValue;
  }
  
  // 3. 从query参数获取 (fingerprint_id 或 fp_id)
  const queryValue = query.fingerprint_id || query.fp_id;
  if (queryValue && isValidFingerprintId(queryValue)) {
    return queryValue;
  }
  
  return null;
}
```

#### ID格式验证规则

```typescript
export function isValidFingerprintId(fingerprintId: string): boolean {
  // 支持的格式：
  // ✅ fp_abc123def456 (FingerprintJS - 常见)
  // ✅ fp_fallback_1692345678901_x7k9m2n4p (客户端降级 - 偶尔)
  // ⚠️ fp_server_1692345678901_x7k9m2n4p (服务端降级 - 理论上不会发生)
  return /^fp(_fallback|_server)?_[a-zA-Z0-9_]+$/.test(fingerprintId);
}
```

#### 关键执行时序说明

**❌ 错误理解**: middleware在首次页面请求时就能获取到fingerprintId
**✅ 正确理解**: 
1. **首次页面请求** → middleware → extractFingerprintId → **返回null**（因为用户第一次访问）
2. **React应用渲染** → FingerprintProvider挂载 → 生成fingerprintId → 存储到localStorage/cookie
3. **后续API请求** → middleware → extractFingerprintId → **返回fingerprintId**（从header/cookie获取）

#### 首次访问冲突问题及解决方案

**🔥 核心问题**：这是一个经典的"鸡生蛋"问题
```
首次访问流程冲突：
1. 用户输入URL → 浏览器发起GET请求 → middleware执行 → 没有指纹ID ❌
2. 返回HTML → React hydration → 生成指纹ID ✅
3. 下次请求才能携带指纹ID → middleware才能提取 ✅
```

**🏭 业界标准做法**：
- **FingerprintJS官方**：指纹收集只能在客户端进行，服务端负责提取和验证
- **延迟初始化策略**：首次页面加载不依赖指纹ID，客户端hydration后再生成
- **分层处理**：页面渲染 + 异步指纹初始化 + 后续API调用

**✅ 推荐解决方案**：

1. **Middleware优雅降级**：
   ```typescript
   // middleware.ts
   export function middleware(request: NextRequest) {
     const fingerprintId = extractFingerprintId(request.headers, request.cookies);
     
     // 首次访问：fingerprintId = null，正常继续
     if (!fingerprintId) {
       console.log('首次访问，跳过指纹验证');
       return NextResponse.next();
     }
     
     // 后续访问：验证和处理指纹ID
     if (isValidFingerprintId(fingerprintId)) {
       const response = NextResponse.next();
       response.headers.set('x-fingerprint-id', fingerprintId);
       return response;
     }
   }
   ```

2. **客户端两阶段初始化**：
   ```typescript
   // FingerprintProvider.tsx
   useEffect(() => {
     // 第一阶段：页面加载完成后生成指纹
     const initFingerprint = async () => {
       const fpId = await generateFingerprintId();
       setFingerprintId(fpId);
     };
     
     initFingerprint();
   }, []);
   
   useEffect(() => {
     // 第二阶段：有指纹ID后初始化用户
     if (fingerprintId && autoInitialize) {
       initializeAnonymousUser();
     }
   }, [fingerprintId]);
   ```

3. **API路由容错处理**：
   ```typescript
   // /api/user/anonymous/init/route.ts
   export async function POST(request: NextRequest) {
     const fingerprintId = extractFingerprintId(
       request.headers, 
       request.cookies,
       await request.json()
     );
     
     if (!fingerprintId) {
       return NextResponse.json(
         { error: '指纹ID缺失，请刷新页面重试' }, 
         { status: 400 }
       );
     }
     
     // 正常处理逻辑...
   }
   ```

**📋 最佳实践总结**：
- ✅ **首次访问允许无指纹**：middleware和API优雅处理null情况
- ✅ **客户端主导生成**：所有指纹生成在浏览器中完成
- ✅ **服务端负责验证**：只做提取、验证、存储工作
- ✅ **异步初始化用户**：页面渲染不阻塞在指纹生成上
- ✅ **后续请求增强**：第二次及以后的请求携带完整指纹信息

### 匿名用户首次访问时序图

```mermaid
sequenceDiagram
    participant Browser as 浏览器
    participant Middleware as middleware.ts
    participant FP_Lib as fingerprint.ts
    participant Hook as useFingerprint.ts
    participant Provider as FingerprintProvider.tsx
    participant API as /api/user/anonymous/init
    participant DB as 数据库

    Note over Browser,DB: 🚀 用户首次访问网站

    Browser->>Middleware: 1. 请求页面 (GET)
    Middleware->>FP_Lib: 2. extractFingerprintId(headers, cookies)
    FP_Lib-->>Middleware: 3. return null (首次访问无fingerprint)
    Note over Middleware: 4. 跳过fingerprint处理<br/>(非API路由请求)
    Middleware-->>Browser: 5. 返回页面HTML (包含React应用)

    Note over Browser,DB: 📱 客户端React应用启动和Fingerprint初始化

    Browser->>Provider: 6. <FingerprintProvider> 组件挂载
    Provider->>Hook: 7. useFingerprint() hook初始化
    Hook->>FP_Lib: 8. initializeFingerprintId()
    FP_Lib->>FP_Lib: 9. 检查localStorage/cookie
    Note over FP_Lib: localStorage: null<br/>cookie: null
    FP_Lib->>FP_Lib: 10. 尝试使用FingerprintJS收集浏览器特征
    
    alt FingerprintJS成功
        FP_Lib->>FP_Lib: 生成真实指纹: fp_abc123def456
    else FingerprintJS失败(降级)
        FP_Lib->>FP_Lib: 生成降级ID: fp_fallback_1692345678901_x7k9m2n4p
    end
    
    FP_Lib->>FP_Lib: 11. 存储到localStorage和cookie
    FP_Lib-->>Hook: 12. return fingerprintId
    Hook-->>Provider: 13. 设置状态: fingerprintId = "fp_xxx"

    Note over Browser,DB: 🔄 自动初始化匿名用户

    Provider->>Provider: 14. useEffect检测到fingerprintId
    Provider->>Hook: 15. 触发 initializeAnonymousUser()
    Hook->>Hook: 16. 设置 isLoading = true
    Hook->>API: 17. POST /api/user/anonymous/init<br/>Headers: X-Fingerprint-Id: fp_xxx<br/>Body: {fingerprintId: "fp_xxx"}

    Note over API,DB: 🏗️ 服务端处理匿名用户创建<br/>Middleware再次处理指纹ID

    API->>Middleware: 18. API请求经过middleware处理
    Middleware->>FP_Lib: 19. extractFingerprintId(headers, cookies)
    FP_Lib-->>Middleware: 20. return "fp_xxx" (从X-Fingerprint-Id header)
    Middleware->>API: 21. 继续处理API请求
    
    API->>FP_Lib: 22. extractFingerprintId(headers, cookies, body)
    FP_Lib-->>API: 23. return "fp_xxx"
    API->>FP_Lib: 24. isValidFingerprintId("fp_xxx")
    
    alt 有效的FingerprintJS ID
        FP_Lib-->>API: return true (fp_abc123def456)
    else 有效的降级ID  
        FP_Lib-->>API: return true (fp_fallback_1692345678901_x7k9m2n4p)
    else 服务端环境降级（理论情况）
        Note over FP_Lib: ⚠️ 在当前架构下不会发生<br/>因为指纹生成只在客户端执行
        FP_Lib-->>API: return true
    end
    API->>DB: 27. findByFingerprintId
    DB-->>API: 28. return null (用户不存在)

    Note over API,DB: 📝 初始化匿名用户
    API->>DB: 29. 创建新匿名用户
    API->>DB: 30. 创建初始化订阅记录
    API->>DB: 31. 创建积分记录
    API->>DB: 32. 积分操作留痕
    DB-->>API: 33. return success

    Note over API,DB: ✅ 返回初始化结果

    API-->>Hook: 34. return {success: true, user: {...}, credits: {...}, isNewUser: true}

    Hook->>Hook: 35. 更新状态:<br/>- anonymousUser = user<br/>- credits = credits<br/>- isInitialized = true<br/>- isLoading = false
    Hook-->>Provider: 36. 状态更新完成
    Provider-->>Browser: 37. 触发组件重新渲染

    Note over Browser,DB: 🎉 用户界面更新

    Browser->>Browser: 38. 显示用户状态<br/>订阅状态<br/>积分状态<br/>
```

### 匿名用户首次访问流程图

```mermaid
flowchart TB
    %% 全局配置
    classDef phase fill:#f3e5f5,stroke:#9333ea,stroke-width:2px,color:#4a148c
    classDef task fill:#e8f5e8,stroke:#2e7d32,stroke-width:1px,color:#1b5e20
    classDef decision fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d47a1
    classDef key fill:#fff3e0,stroke:#ff6f00,stroke-width:2px,color:#e65100

    %% === 阶段 1: 入口与环境判断 ===
    subgraph S1["阶段1: 入口与环境"]
        direction TB
        T1A([用户访问网站]):::task
        T1B((浏览器环境?)):::decision
        T1A --> T1B
    end
    S1:::phase

    %% === 阶段 2: 服务端 & 客户端初始化 (并行) ===
    subgraph S2["阶段2: 服务端 & 客户端初始化"]
        direction LR
        subgraph Server[服务端渲染]
            direction TB
            T2A[middleware.ts<br/>提取fingerprint]:::task
            T2B((存在?)):::decision
            T2C[设置header]:::task
            T2D[跳过]:::task
            T2B -->|是| T2C
            T2B -->|否| T2D
            T2C & T2D --> T2E[返回HTML]
        end

        subgraph Client[客户端初始化]
            direction TB
            T2F[初始化Fingerprint]:::task
            T2G((本地存储?)):::decision
            T2H[使用现有]:::task
            T2I[生成 fp_ + 32位<br/>保存 localStorage/cookie]:::task
            T2G -->|有| T2H
            T2G -->|无| T2I
            T2H & T2I --> T2J[fingerprint就绪]:::key
        end
    end
    S2:::phase

    %% === 阶段 3: React 启动 ===
    subgraph S3["阶段3: React 启动"]
        direction TB
        T3A[React应用启动]:::task
        T3B[Provider挂载]:::task
        T3C[useFingerprint]:::task
        T3A --> T3B --> T3C --> T2J
    end
    S3:::phase

    %% === 阶段 4: 初始化决策 ===
    subgraph S4["阶段4: 初始化决策"]
        direction TB
        T4A((autoInitialize?)):::decision
        T4B[手动调用<br/>initializeAnonymousUser]:::task
        T4A -->|否| T4B
        T4A -->|是| T4C[检查匿名用户]
        T4B --> T4C
    end
    S4:::phase

    %% === 阶段 5: 用户检查 & 创建 (并行) ===
    subgraph S5["阶段5: 用户检查 & 创建"]
        direction LR
        subgraph Check[检查用户]
            direction TB
            T5A["调用 GET<br/>/api/user/anonymous/init"]:::task
            T5B((用户存在?)):::decision
            T5A --> T5B
        end

        subgraph Create[创建用户]
            direction TB
            T5C[创建用户<br/>+订阅+积分]:::task
            T5D((格式有效?)):::decision
            T5E[CreditInsert<br/>记录积分]:::task
            T5F[创建成功]:::task
            T5G[错误状态<br/>显示错误信息]:::task
            T5D -->|是| T5E --> T5F
            T5D -->|否| T5G
        end
    end
    S5:::phase

    %% === 阶段 6: 渲染结果 ===
    subgraph S6["阶段6: 渲染结果"]
        direction TB
        T6A[加载用户]:::task
        T6B[更新React状态]:::task
        T6C[渲染界面]:::task
        T6D[显示Fingerprint ID]:::task
        T5B -->|是| T6A
        T5F --> T6B
        T6A --> T6B
        T6B --> T6C --> T6D
        T5G --> T6C
    end
    S6:::phase

    %% === 主干连接 ===
    T1B -->|否| Server
    T1B -->|是| Client
    T2E --> S3
    T4C --> Check
    T5B -->|否| Create

    %% === 阶段串联 ===
    S1 --> S2
    S2 --> S3
    S3 --> S4
    S4 --> S5
    S5 --> S6

    %% === 关键路径高亮 ===
    linkStyle 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30 stroke:#9333ea,stroke-width:2px
```

### 核心文件交互图

```mermaid
flowchart TD
    subgraph 浏览器环境
        浏览器
        localStorage[localStorage]
        Cookie[Cookie]
    end
    
    subgraph Next.js中间件层
        middleware.ts
    end
    
    subgraph React客户端
        React组件
        FingerprintProvider.tsx
        useFingerprint.ts
    end
    
    subgraph 工具库
        fingerprint.ts
    end
    
    subgraph API层
        subgraph "/api/user/anonymous/init/route.ts"
            InitAPI["/api/user/anonymous/init/route.ts"]
        end
    end
    
    subgraph 服务层
        userService.ts
        subscriptions.ts
        creditService.ts
        creditAuditLogService.ts
    end
    
    subgraph 数据库
        users表[(users表)]
        subscriptions表[(subscriptions表)]
        credits表[(credits表)]
        credit_audit_log表[(credit_audit_log表)]
    end
    
    浏览器 --> middleware.ts
    middleware.ts --> React组件
    React组件 --> FingerprintProvider.tsx
    FingerprintProvider.tsx --> useFingerprint.ts
    useFingerprint.ts --> fingerprint.ts
    useFingerprint.ts --> InitAPI
    
    fingerprint.ts --> localStorage
    fingerprint.ts --> Cookie
    
    InitAPI --> userService.ts
    InitAPI --> subscriptions.ts
    InitAPI --> creditService.ts
    InitAPI --> creditAuditLogService.ts
    
    userService.ts --> users表
    subscriptions.ts --> subscriptions表
    creditService.ts --> credits表
    creditAuditLogService.ts --> credit_audit_log表
    
    style 浏览器 fill:#e3f2fd
    style React组件 fill:#f3e5f5
    style InitAPI fill:#e8f5e8
    style users表 fill:#fff3e0
```

## 遗留问题
> 因为SSR渲染以及性能考虑，并不能在首屏渲染时就把Context数据就准备好，所以首屏服务端渲染的结果是没有Context的
> 这导致浏览器侧首先会渲染出空context数据的结果，然后再有客户端组件初始化

```
是的。Next.js App Router 里 (home) 和 (clerk) 都是 [locale] 路由下的并行 segment，它们各自有自己的 layout.tsx。你在这两个 layout 里都包了 FingerprintProvider，意味着进入 (home) 这一支会创建一个
  Provider 实例，切到 (clerk) 时会卸载前一个、再新建另一个实例。两个实例的内部状态互不共享，各自都会重新执行 useFingerprint 的初始化流程（生成 fingerprintId、调用后端等），因此会看到重复请求和“重新初始
  化”的现象。

  如果希望 fingerprint 上下文在整个 [locale] 下共享（无论是 home 页还是 clerk 页），应当把 FingerprintProvider 往上提升到更高一级（比如 [locale]/layout.tsx 或应用根 layout.tsx），让所有 segment 共用同一
  个 Provider。这样在客户端只会有一个 useFingerprint 实例，多个子组件通过 useFingerprintContextSafe() 读取同一套状态，也就不会出现“两个傻瓜各自初始化”的情况了。
```

```mermaid
sequenceDiagram
      autonumber
      participant Server as Next.js Server (RSC/SSR)
      participant Browser as Browser
      participant Layout as Layout Component
      participant FPProvider as FingerprintProvider (Client)
      participant MoneyPrice as MoneyPriceInteractive (Client)
      participant Hook as useFingerprint Hook
      participant API as Fingerprint API

      Server->>Layout: render layout.tsx (async)
      Layout->>Server: returns tree wrapped with FingerprintProvider & HomeLayout
      Server->>Browser: sends HTML + hydration data (fingerprint context empty)

      Browser->>Layout: hydrate Client Components
      Layout->>FPProvider: create client instance (state: fingerprintId=null,\nxSubscription=null,isLoading=true)
      FPProvider->>MoneyPrice: renders children with empty context
      MoneyPrice->>MoneyPrice: useState(defaultBilling) → renders default switch selection

      Note over Browser,Hook: Hydration finished <br/>now useEffect tasks can run
      Browser->>Hook: useEffect(() => initializeFingerprintId(), [])
      Hook->>Hook: setIsLoading(true)
      Hook->>API: getOrGenerateFingerprintId()
      API-->>Hook: fingerprintId
      Hook->>Hook: setFingerprintId(fingerprintId)

      Browser->>Hook: second useEffect runs when fingerprintId ready
      Hook->>API: POST /fingerprint (fetch user/subscription)
      API-->>Hook: { success, xSubscription, ... }
      Hook->>Hook: setXSubscription(xSubscription), setIsLoading(false)

      FPProvider->>MoneyPrice: context update (xSubscription now active)
      MoneyPrice->>MoneyPrice: useEffect detects subscription priceId
      MoneyPrice->>MoneyPrice: setBillingType(detectedBilling) (overrides default)

      Note over MoneyPrice: UI now switches from default (Yearly) to real (Monthly)
```

## 数据流程总结

1. **首次访问**：
   - 生成fingerprint ID
   - 调用 `/api/user/anonymous/init` 创建匿名用户
   - 分配50免费积分

2. **再次访问**：
   - 从localStorage/cookie获取fingerprint ID
   - 调用 `/api/user/anonymous/init` 获取现有用户数据

3. **用户注册**：
   - Clerk webhook接收用户创建事件
   - 根据传递的user_id升级匿名用户为注册用户

4. **用户注销**：
   - Clerk webhook接收用户删除事件
   - 备份并删除用户数据
   - 用户重新成为匿名状态

## 安全考虑

- Fingerprint ID只用于匿名用户识别，不包含敏感信息
- 每个fingerprint限制分配的免费积分，防止滥用
- 支持GDPR合规的用户数据删除
- 所有API请求都经过适当的验证和错误处理

## 性能优化

- Fingerprint ID存储在localStorage和cookie中，减少重复生成
- 中间件只在必要时处理fingerprint逻辑
- React Context提供缓存的用户数据，避免重复API调用
- 懒加载用户数据，只在需要时初始化

