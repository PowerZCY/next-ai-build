-- 用户表
CREATE TABLE IF NOT EXISTS public.users (
    id                BIGSERIAL PRIMARY KEY,
    user_id           UUID           NOT NULL DEFAULT gen_random_uuid(),
    status            VARCHAR(20)    NOT NULL DEFAULT 'anonymous',
    fingerprint_id    VARCHAR(255),
    clerk_user_id     VARCHAR(255),
    email             VARCHAR(255),
    created_at        TIMESTAMPTZ    DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_user_id_key UNIQUE (user_id),
    CONSTRAINT users_clerk_user_id_key UNIQUE (clerk_user_id),
    CONSTRAINT users_status_check CHECK (status::text = ANY (ARRAY['anonymous'::character varying, 'registered'::character varying, 'frozen'::character varying, 'deleted'::character varying]::text[]))
);

CREATE INDEX IF NOT EXISTS idx_users_fingerprint_id ON public.users (fingerprint_id);

-- 订阅表
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id                   BIGSERIAL PRIMARY KEY,
    user_id              UUID        NOT NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'incomplete',
    pay_subscription_id  VARCHAR(255),
    price_id             VARCHAR(255),
    price_name           VARCHAR(255),
    credits_allocated    INTEGER     NOT NULL DEFAULT 0,
    sub_period_start     TIMESTAMPTZ,
    sub_period_end       TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted              INTEGER     NOT NULL DEFAULT 0,
    CONSTRAINT subscriptions_user_fk FOREIGN KEY (user_id)
        REFERENCES public.users (user_id)
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT subscriptions_status_check CHECK (status::text = ANY (ARRAY['active'::character varying, 'canceled'::character varying, 'past_due'::character varying, 'incomplete'::character varying, 'trialing'::character varying]::text[])),
    CONSTRAINT transactions_deleted_check CHECK (deleted = ANY (ARRAY[0, 1]))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_pay_subscription_id ON public.subscriptions (pay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);

-- 积分表
CREATE TABLE IF NOT EXISTS public.credits (
    id                        BIGSERIAL PRIMARY KEY,
    user_id                   UUID        NOT NULL,
    balance_free              INTEGER     NOT NULL DEFAULT 0,
    total_free_limit          INTEGER     NOT NULL DEFAULT 0,
    free_start                TIMESTAMPTZ,
    free_end                  TIMESTAMPTZ,
    balance_paid              INTEGER     NOT NULL DEFAULT 0,
    total_paid_limit          INTEGER     NOT NULL DEFAULT 0,
    paid_start                TIMESTAMPTZ,
    paid_end                  TIMESTAMPTZ,
    balance_onetime_paid      INTEGER     NOT NULL DEFAULT 0,
    total_onetime_paid_limit  INTEGER     NOT NULL DEFAULT 0,
    onetime_paid_start        TIMESTAMPTZ,
    onetime_paid_end          TIMESTAMPTZ,
    created_at                TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT credits_user_id_key UNIQUE (user_id),
    CONSTRAINT credits_user_fk FOREIGN KEY (user_id)
        REFERENCES public.users (user_id)
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

CREATE INDEX IF NOT EXISTS idx_credits_user_id ON public.credits (user_id);

-- 交易订单表
CREATE TABLE IF NOT EXISTS public.transactions (
    id                   BIGSERIAL PRIMARY KEY,
    user_id              UUID         NOT NULL,
    order_id             VARCHAR(255) NOT NULL,
    order_status         VARCHAR(20)  NOT NULL DEFAULT 'created',
    order_created_at     TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    order_expired_at     TIMESTAMPTZ,
    order_updated_at     TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    type                 VARCHAR(20),
    pay_supplier         VARCHAR(50),
    pay_session_id       VARCHAR(255),
    pay_transaction_id   VARCHAR(255),
    pay_subscription_id  VARCHAR(255),
    price_id             VARCHAR(255),
    price_name           VARCHAR(255),
    amount               NUMERIC(10, 2),
    currency             VARCHAR(10),
    credits_granted      INTEGER      NOT NULL DEFAULT 0,
    pay_invoice_id       VARCHAR(255),
    payment_status       VARCHAR(20)  NOT NULL DEFAULT 'un_paid',
    billing_reason       VARCHAR(50),
    hosted_invoice_url   TEXT,
    invoice_pdf          TEXT,
    order_detail         TEXT,
    paid_email           VARCHAR(255),
    paid_at              TIMESTAMPTZ,
    paid_detail          TEXT,
    pay_updated_at       TIMESTAMPTZ,
    deleted              INTEGER      NOT NULL DEFAULT 0,
    CONSTRAINT transactions_order_id_key UNIQUE (order_id),
    CONSTRAINT transactions_pay_transaction_id_key UNIQUE (pay_transaction_id),
    CONSTRAINT transactions_user_fk FOREIGN KEY (user_id)
        REFERENCES public.users (user_id)
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT transactions_order_status_check CHECK (order_status::text = ANY (ARRAY['created'::character varying, 'pending_unpaid'::character varying, 'success'::character varying, 'refunded'::character varying, 'canceled'::character varying, 'failed'::character varying]::text[])),
    CONSTRAINT transactions_pay_supplier_check CHECK (pay_supplier::text = ANY (ARRAY['Stripe'::character varying, 'Apple'::character varying, 'Paypal'::character varying]::text[])),
    CONSTRAINT transactions_type_check CHECK (type::text = ANY (ARRAY['subscription'::character varying, 'one_time'::character varying]::text[])),
    CONSTRAINT transactions_payment_status_check CHECK (payment_status::text = ANY (ARRAY['un_paid'::character varying, 'paid'::character varying, 'no_payment_required'::character varying]::text[])),
    CONSTRAINT transactions_deleted_check CHECK (deleted = ANY (ARRAY[0, 1]))
);

CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions (order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_pay_subscription_id ON public.transactions (pay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);


-- 积分使用审计表
CREATE TABLE IF NOT EXISTS public.credit_usage (
    id               BIGSERIAL PRIMARY KEY,
    user_id          UUID         NOT NULL,
    feature          VARCHAR(255),
    credit_type      VARCHAR(10)  NOT NULL,
    operation_type   VARCHAR(20)  NOT NULL,
    credits_used     INTEGER      NOT NULL,
    order_id         VARCHAR(255),
    created_at       TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    deleted          INTEGER      NOT NULL DEFAULT 0,
    CONSTRAINT credit_usage_user_fk FOREIGN KEY (user_id)
        REFERENCES public.users (user_id)
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT credit_usage_credit_type_check CHECK (credit_type::text = ANY (ARRAY['free'::character varying, 'paid'::character varying]::text[])),
    CONSTRAINT credit_usage_operation_type_check CHECK (operation_type::text = ANY (ARRAY['consume'::character varying, 'recharge'::character varying, 'freeze'::character varying, 'unfreeze'::character varying]::text[])),
    CONSTRAINT credit_usage_deleted_check CHECK (deleted = ANY (ARRAY[0, 1]))
);

CREATE INDEX IF NOT EXISTS idx_credit_usage_credit_type ON public.credit_usage (credit_type);
CREATE INDEX IF NOT EXISTS idx_credit_usage_operation_type ON public.credit_usage (operation_type);
CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON public.credit_usage (user_id);


-- 用户信息备份表
CREATE TABLE IF NOT EXISTS public.user_backup (
    id                BIGSERIAL PRIMARY KEY,
    original_user_id  UUID         NOT NULL,
    status            VARCHAR(50),
    fingerprint_id    VARCHAR(255),
    clerk_user_id     VARCHAR(255),
    email             VARCHAR(255),
    backup_data       JSONB,
    deleted_at        TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    created_at        TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    deleted           INTEGER      NOT NULL DEFAULT 0,
    CONSTRAINT user_backup_deleted_check CHECK (deleted = ANY (ARRAY[0, 1]))
);

CREATE INDEX IF NOT EXISTS idx_user_backup_clerk_user_id ON public.user_backup (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_backup_email ON public.user_backup (email);
CREATE INDEX IF NOT EXISTS idx_user_backup_fingerprint_id ON public.user_backup (fingerprint_id);
CREATE INDEX IF NOT EXISTS idx_user_backup_original_user_id ON public.user_backup (original_user_id);


-- 第三方对接日志审计表
CREATE TABLE IF NOT EXISTS public.apilog (
    id            BIGSERIAL PRIMARY KEY,
    api_type      VARCHAR(50)  NOT NULL,
    method_name   VARCHAR(255) NOT NULL,
    summary       TEXT,
    request       TEXT,
    response      TEXT,
    created_at    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT apilog_api_type_check CHECK (api_type::text = ANY (ARRAY['from_clerk_in'::character varying, 'to_clerk_out'::character varying, 'from_stripe_in'::character varying, 'to_stripe_out'::character varying]::text[]))
);
