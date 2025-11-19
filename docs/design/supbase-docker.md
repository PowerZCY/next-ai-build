# 本地 Supabase 完全自托管开发环境搭建指南  
—— 专为 Next.js + Prisma 多项目开发打造（2025 年最新版）

## 终极结论：本地开发永远这么干（再也不翻车）

1. **pooler（supavisor）直接注释掉** → 再见 tenant 地狱
2. **db 服务暴露原始端口 5432:5432** → Prisma 直连原始 PostgreSQL
3. **Prisma 配置必须写全**：
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     schemas  = ["diaomao", "public"]   // 必须带 public！
   }

   // 所有模型必须加
   @@schema("diaomao")
   ```
4. **schema创建必须禁用RSL**
   ```sql
    -- 第一步：彻底删除 diaomao schema（连里面的表、序列、权限全炸）
    DROP SCHEMA IF EXISTS diaomao CASCADE;

    -- 第二步：重新创建干净的 diaomao schema
    CREATE SCHEMA diaomao;

    -- 第三步：把所有权给 postgres（防止任何权限问题）
    ALTER SCHEMA diaomao OWNER TO postgres;

    -- 第四步：给常用角色全开权限（本地开发保险起见）
    GRANT ALL ON SCHEMA diaomao TO postgres;
    GRANT ALL ON SCHEMA diaomao TO anon;
    GRANT ALL ON SCHEMA diaomao TO authenticated;
    GRANT ALL ON SCHEMA diaomao TO service_role;

    -- 第五步：以后在这个 schema 里建的表默认关闭 RLS（本地开发神器）
    ALTER DEFAULT PRIVILEGES IN SCHEMA diaomao REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
    ALTER DEFAULT PRIVILEGES IN SCHEMA diaomao GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA diaomao GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
   ```
5. **所有项目 .env.local 永远写死**：
   ```env
   DATABASE_URL=postgresql://postgres:你的密码@localhost:5432/postgres?schema=你的项目名
   ```

## 一天踩过的所有深坑（永载史册）

| 坑名                     | 症状                                  | 解决方案                              |
|--------------------------|---------------------------------------|---------------------------------------|
| Tenant or user not found | 连 6543 永远报这个                    | 注释掉整个 supavisor 服务            |
| permission denied table  | 关了 public RLS 没用                  | 自定义 schema 默认 RLS 开启          |
| permission denied sequence | 关了表 RLS 还是报错                   | 序列权限没给                          |
| Prisma 找错 schema       | 明明写了 ?schema= 还是去 public       | 没加 schemas + @@schema               |
| 端口随机跳               | 重启后 5432 变成 5454                 | docker-compose.yml 没写死 ports       |
| 配置不生效               | .env 改了重启没用                     | pooler 不读所有 .env 变量             |

现在你拥有的，是 2025 年 11 月经过血与泪验证的最稳本地 Supabase 配置  
从此本地开发 = 生产环境，爽到飞起！

## 一图概览
```mermaid
flowchart TB
    %% ==================== 样式定义（已修复 end 冲突） ====================
    classDef phase fill:#f0e7ff,stroke:#9333ea,stroke-width:2px,color:#333,stroke-dasharray: 5 5
    classDef task fill:#e6f7e6,stroke:#22c55e,stroke-width:2px,color:#166534
    classDef decision fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#1e40af
    classDef key fill:#fef3c7,stroke:#f59e0b,stroke-width:3px,color:#92400e
    classDef final fill:#fee2e2,stroke:#ef4444,stroke-width:3px,color:#991b1b

    %% ==================== 阶段定义 ====================
    subgraph Phase1["阶段1: 准备工作"]
        direction TB
        A1[下载 Supabase 仓库]
        A2[进入 docker 文件夹]
        A3[复制 .env.example 到 .env]
        A4[编辑 .env 文件，配置账号·密码]
        A5[编辑 docker-compose.yml文件<br/>注释掉supavisor来禁用pooler<br/>丢该db暴漏端口5432:5432]
    end

    subgraph Phase2["阶段2: 关键配置"]
        direction LR
        B1[POSTGRES_PASSWORD=你自己的密码]
        B2[可选：POSTGRES_DB=postgres]
        B3[可选：POSTGRES_PORT=5432<br/>注意关闭本机的postgrsql 5432冲突]
        B4[KONG_HTTP_PORT=8000<br/>Studio地址]
        B5[ADDITIONAL_REDIRECT_URLS=http://localhost:*<br/>支持所有本地端口登录回调]
    end

    subgraph Phase3["阶段3: 启动 Supabase"]
        direction TB
        C1[打开终端<br/>cd 到 supabase/docker]
        C2[执行启动命令]
        C3{命令行启动}
        C3 --> C5[docker compose up -d  等待下载启动完成]
        C6[等待 1-3 分钟<br/>所有容器变绿]
    end

    subgraph Phase4["阶段4: 验证是否成功"]
        direction TB
        D1[打开浏览器访问<br/>http://localhost:8000]
        D2[看到 Supabase Studio 登录页]
        D3[默认账号密码<br/>admin /admin]
    end

    subgraph Phase5["阶段5: 项目连接配置"]
        direction TB
        E1[所有项目 .env.local 这样写]
        E2[数据库连接]
        E3["DATABASE_URL=postgresql://postgres:你的密码@localhost:5432/postgres"]
        E4-0[多项目隔离<br/>加 ?schema=项目名]
        E4-1[prisma.schema要使用多schemas模式]
        E4-2[建schema前要关闭RSL权限]
        E5["DATABASE_URL=postgresql://postgres:你的密码@localhost:5432/postgres?schema=diaomao"]
        E6[如果用 supabase-js 客户端]
        E7[NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000]
        E8[NEXT_PUBLIC_SUPABASE_ANON_KEY=你 .env 里的长字符串]
    end

    subgraph Phase6["阶段6: 日常操作"]
        direction LR
        F1[启动 → Docker Desktop 点 Start<br/>或 docker compose up -d]
        F2[停止 → Docker Desktop 点 Stop<br/>或 docker compose down]
        F3[改配置 → 编辑 .env → 点 Restart 就生效<br/>不用重建镜像]
        F4[关闭 Docker Desktop → 所有容器停止<br/>下次用再打开即可]
    end

    %% ==================== 主流程连接 ====================
    A1 --> A2 --> A3 --> A4 -->A5
    Phase1 --> Phase2
    Phase2 --> Phase3
    Phase3 --> Phase4
    Phase4 --> Phase5
    Phase5 --> Phase6

    %% ==================== 高亮关键路径 ====================
    linkStyle default stroke:#9333ea,stroke-width:3px

    %% ==================== 节点分类 ====================
    class A4,B5,C5,D1,E3,E5 key
    class Phase1,Phase2,Phase3,Phase4,Phase5,Phase6 phase
    class C3 decision
```



## 为什么本地要跑一套完整的 Supabase？

- 和线上生产环境 100% 一致（RLS、Auth、Storage、Realtime、Edge Functions 全都有）  
- 多项目开发时，只需一个 Supabase 实例，用 `?schema=xxx` 完美隔离  
- 彻底摆脱 Neon/Vercel Postgres 的冷启动、连接数限制  
- 所有功能本地调试零延迟，再也不用频繁切到云端项目

## 一、一次性准备（只需做一次）

1. **下载官方仓库**  
   ```bash
   git clone https://github.com/supabase/supabase.git
   cd supabase/docker
   ```

2. **配置 .env（最简极致版）**  
   复制 `.env.example` → `.env`，然后只改这几行就够了：

   ```properties
   POSTGRES_PASSWORD=123456          # 自己记牢的密码
   # 可选：改数据库名，避免和本机 Postgres 冲突
   POSTGRES_DB=supabase_local

   # 可选：改端口，彻底避开本机 5432
   POSTGRES_PORT=5544

   # 保持默认就行（强烈建议不动）
   KONG_HTTP_PORT=8000
   POOLER_PROXY_PORT_TRANSACTION=6543
   ADDITIONAL_REDIRECT_URLS=http://localhost:*
   ```

## 二、启动与停止（以后日常操作）

| 操作           | 命令（终端）                          | 图形化方式（Docker Desktop）         |
|----------------|---------------------------------------|--------------------------------------|
| 启动           | `docker compose up -d`                | 拖 docker 文件夹 → 点 Start          |
| 停止           | `docker compose down`                 | 点 Stop                              |
| 重启（改配置后）| `docker compose restart` 或点 Restart | 点 Restart                           |
| 完全删掉重来   | `docker compose down -v && up -d`     | Delete 项目（数据会清空）            |

> 改完 .env 后，只需要点 Restart 就生效，**绝不用重新 build 镜像**！

## 三、关键端口记死（一辈子就这几个）

| 端口  | 用途                                    | 永远这么写 |
|-------|-----------------------------------------|------------|
| 8000  | Studio + 所有 API 网关（Kong）          | `http://localhost:8000` |
| 6543  | 带 RLS + 连接池的 PostgreSQL（官方推荐）| **Prisma 永远连这个** |

## 四、所有项目 .env.local 永久写法（复制粘贴就行）

```env
# 数据库（推荐方式，和生产完全一致）
DATABASE_URL=postgresql://postgres:123456@localhost:6543/supabase_local

# 多项目隔离（只改这行）
DATABASE_URL=postgresql://postgres:123456@localhost:6543/supabase_local?schema=project_a
DATABASE_URL=postgresql://postgres:123456@localhost:6543/supabase_local?schema=project_b

# 如果项目里用了 supabase-js 客户端
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=你 .env 里那串超长的 anon key
```

## 五、常见问题秒答

| 问题                              | 答案                                      |
|-----------------------------------|-------------------------------------------|
| 本机有 PostgreSQL 5432 会冲突吗？ | 改 `POSTGRES_PORT=5544` 或直接连 6543 就完全不冲突 |
| 关闭 Docker Desktop 会停吗？      | 会停。下次用再打开即可（或改用 colima 实现真后台） |
| 要不要管 PGRST_DB_SCHEMAS？       | 只用 Prisma 的话完全不用管，保持默认即可  |
| 一个 Supabase 能支持多少项目？    | 100 个都轻松，靠 schema 隔离就行          |

## 六、总结：你现在拥有了一个永远本地可用的「生产级 Supabase」

- 打开 http://localhost:8000 → 完整 Studio  
- 所有项目 DATABASE_URL 永远写 6543 + 不同 schema  
- 改配置 → 点 Restart → 立即生效  
- 再也不用担心连接数、冷启动、端口冲突
